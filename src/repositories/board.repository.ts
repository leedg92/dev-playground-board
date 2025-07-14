import { FastifyInstance } from "fastify";
import { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { RowDataSchema } from "../schemas/rowData.schema.js";
import bcrypt from "bcrypt";

export class BoardRepository {
    private readonly tableName = "board";
    private readonly algorithm = process.env.ALGORITHM; // MySQL 해싱 함수
    private readonly method = process.env.METHOD; // SHA2 bit 길이
    private readonly saltRounds = process.env.SALT_ROUNDS; // bcrypt salt rounds
    private db: Pool;
    constructor(private readonly fastify: FastifyInstance) {
        this.db = fastify.boardDb;
    }

    /**
     * 게시판 총 개수 조회
     * @param search 검색어 (선택사항)
     * @returns 게시판 총 개수
     */
    async getTotalCount(search: string = ''){
        let query = `SELECT COUNT(*) AS totalCount FROM ${this.tableName}`;
        let queryParams: any[] = [];

        if(search && search.trim() !== ''){
            query += `
            WHERE 1=1 
             AND (title LIKE CONCAT('%', ?, '%') 
             OR content LIKE CONCAT('%', ?, '%') 
             OR writer LIKE CONCAT('%', ?, '%'))
            `;
            queryParams.push(search, search, search);
        }

        try{
            this.fastify.log.info(`실행 쿼리: ${this.db.format(query, queryParams)}`);
            const [rows] = await this.db.query<RowDataPacket[]>(query, queryParams);
            return rows[0].totalCount;
        }catch(error){
            this.fastify.logDbError('board', 'board', '게시판 총 개수 조회 실패', error);
            throw error;
        }
    }

    /**
     * 게시판 데이터 조회
     * @param terminalName 터미널명
     * @param limit 조회 개수 (기본값: 10)
     * @returns 게시판 데이터 목록
     */
    async getList(pageNum: number = 1, rowsPerPage: number = 10, search: string = ''): Promise<RowDataPacket[]> {
        let query = `
            SELECT 
                id,
                title,
                writer,
                created_at as createdAt,
                updated_at as updatedAt
            FROM 
                ${this.tableName}
        `;
        
        let queryParams: any[] = [];
        
        if(search && search.trim() !== ''){
            query += `
            WHERE 1=1 
             AND (title LIKE CONCAT('%', ?, '%') 
             OR content LIKE CONCAT('%', ?, '%') 
             OR writer LIKE CONCAT('%', ?, '%'))
            `;
            queryParams.push(search, search, search);
        }
        
        query += ` 
            ORDER BY id DESC 
            LIMIT ? 
            OFFSET ?
        `;

        const limit = rowsPerPage; // 페이지 당 행 수
        const offset = (pageNum - 1) * rowsPerPage; // 페이지 번호 계산
        
        queryParams.push(limit, offset);

        try {
            this.fastify.log.info(`실행 쿼리: ${this.db.format(query, queryParams)}`);
            const [rows] = await this.db.query<RowDataPacket[]>(query, queryParams);
            return rows;
        } catch (error) {
            this.fastify.logDbError('board', 'board', '게시판 데이터 조회 실패', error);
            throw error;
        }
    }

    /**
     * 게시판 상세 조회
     * @param id 게시판 ID
     * @returns 게시판 상세 데이터
     */
    async getDetail(id: number){
        const query = `
            SELECT 
                id,
                title,
                content,
                writer,
                created_at as createdAt,
                updated_at as updatedAt
            FROM 
                ${this.tableName} 
            WHERE id = ?
        `

        try{
            this.fastify.log.info(`실행 쿼리: ${this.db.format(query, [id])}`);
            const [rows] = await this.db.query<RowDataPacket[]>(query, [id]);
            return rows[0];
        }catch(error){
            this.fastify.logDbError('board', 'board', '게시판 상세 조회 실패', error);
            throw error;
        }
    }

    /**
     * 게시판 등록
     * @param title 제목
     * @param content 내용
     * @param writer 작성자
     * @param password 비밀번호
     * @returns 게시판 등록 결과
     */
    async InsertBoard(title: string, content: string, writer: string, password: string){
        // SHA2로 먼저 해싱한 후 bcrypt로 최종 해싱 (이중 보안)
        const sha2Query = `SELECT ${this.algorithm}(?, ${this.method}) as sha2_hash`;
        const [sha2Result] = await this.db.query<RowDataPacket[]>(sha2Query, [password]);
        const sha2Hash = sha2Result[0].sha2_hash;
        
        const finalPassword = await bcrypt.hash(sha2Hash, Number(this.saltRounds));
        
        const query = `
            INSERT INTO ${this.tableName} 
            (
                title,
                content,
                writer,
                password
            ) VALUES (
                ?,
                ?,
                ?,
                ?
            )
        `

        try{
            this.fastify.log.info(`실행 쿼리: ${this.db.format(query, [title, content, writer, finalPassword])}`);
            const [result] = await this.db.query<ResultSetHeader>(query, [title, content, writer, finalPassword]);
            return result.insertId;
        }catch(error){
            this.fastify.logDbError('board', 'board', '게시판 등록 실패', error);
            throw error;
        }
    }

    /**
     * 게시판 비밀번호 확인
     * @param id 게시판 ID
     * @param password 비밀번호
     * @returns 게시판 비밀번호 확인 결과
     */
    async checkBoardPassword(id: number, password: string){
        // 저장된 bcrypt 해시 가져오기
        const getPasswordQuery = `SELECT password FROM ${this.tableName} WHERE id = ?`;
        const [passwordRows] = await this.db.query<RowDataPacket[]>(getPasswordQuery, [id]);
        
        if (!passwordRows || passwordRows.length === 0) {
            return false;
        }
        
        const storedBcryptHash = passwordRows[0].password;
        
        // 입력 비밀번호를 동일한 방식으로 해싱: SHA2 먼저
        const sha2Query = `SELECT ${this.algorithm}(?, ${this.method}) as sha2_hash`;
        const [sha2Result] = await this.db.query<RowDataPacket[]>(sha2Query, [password]);
        const sha2Hash = sha2Result[0].sha2_hash;

        try{
            // bcrypt로 비교
            const isPasswordCorrect = await bcrypt.compare(sha2Hash, storedBcryptHash);
            return isPasswordCorrect;
        }catch(error){
            this.fastify.logDbError('board', 'board', '게시판 비밀번호 확인 실패', error);
            throw error;
        }
    }

    /**
     * 게시판 삭제
     * @param id 게시판 ID
     * @returns 게시판 삭제 결과
     */
    async deleteBoard(id: number){
        const query = `
            DELETE FROM ${this.tableName} WHERE id = ?
        `

        try{
            this.fastify.log.info(`실행 쿼리: ${this.db.format(query, [id])}`);
            const [result] = await this.db.query<ResultSetHeader>(query, [id]);
            return result.affectedRows;
        }catch(error){
            this.fastify.logDbError('board', 'board', '게시판 삭제 실패', error);
            throw error;
        }
    }

    /**
     * 게시판 수정
     * @param id 게시판 ID
     * @param title 제목
     * @param content 내용
     * @returns 게시판 수정 결과
     */
    async updateBoard(id: number, title: string, content: string){
        const query = `
            UPDATE ${this.tableName}
            SET
                title = IF(title LIKE '[수정됨]%', ?, CONCAT('[수정됨] ', ?)),
                content = ?,
                updated_at = NOW()
            WHERE id = ?
        `

        try{
            this.fastify.log.info(`실행 쿼리: ${this.db.format(query, [title, title, content, id])}`);
            const [result] = await this.db.query<ResultSetHeader>(query, [title, title, content, id]);
            return result.affectedRows;
        }catch(error){
            this.fastify.logDbError('board', 'board', '게시판 수정 실패', error);
            throw error;
        }
    }

}