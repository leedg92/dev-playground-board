import { FastifyInstance } from "fastify";
import { Pool, RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { RowDataSchema } from "../schemas/rowData.schema.js";

export class BoardRepository {
    private readonly tableName = "board";
    private readonly algorithm = process.env.ALGORITHM;
    private readonly method = process.env.METHOD;
    private db: Pool;
    constructor(private readonly fastify: FastifyInstance) {
        this.db = fastify.boardDb;
    }

    /**
     * 게시판 총 개수 조회
     * @returns 게시판 총 개수
     */
    async getTotalCount(){
        const query = `SELECT COUNT(*) AS TOTAL_COUNT FROM ${this.tableName}`;

        try{
            const [rows] = await this.db.query<RowDataPacket[]>(query);
            return rows[0].TOTAL_COUNT;
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
    async getList(pageNum: number = 1, rowsPerPage: number = 10): Promise<RowDataPacket[]> {
        const query = `
            SELECT 
                ID,
                TITLE,
                WRITER,
                CREATED_AT,
                UPDATED_AT
            FROM 
                ${this.tableName}
            ORDER BY ID DESC
            LIMIT ?
            OFFSET ?
        `;

        const limit = rowsPerPage; // 페이지 당 행 수
        const offset = (pageNum - 1) * rowsPerPage; // 페이지 번호 계산

        try {
            const [rows] = await this.db.query<RowDataPacket[]>(query, [rowsPerPage, offset]);
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
                ID,
                TITLE,
                CONTENT,
                WRITER,
                CREATED_AT,
                UPDATED_AT
            FROM 
                ${this.tableName} 
            WHERE ID = ?
        `

        try{
            const [rows] = await this.db.query<RowDataPacket[]>(query, [id]);
            return rows[0];
        }catch(error){
            this.fastify.logDbError('board', 'board', '게시판 상세 조회 실패', error);
            throw error;
        }
    }

    async InsertBoard(title: string, content: string, writer: string, password: string){
        const query = `
            INSERT INTO ${this.tableName} 
            (
                TITLE,
                CONTENT,
                WRITER,
                PASSWORD
            ) VALUES (
                ?,
                ?,
                ?,
                ${this.algorithm}(?,${this.method})
            )
        `

        try{
            const [result] = await this.db.query<ResultSetHeader>(query, [title, content, writer, password]);
            return result.insertId;
        }catch(error){
            this.fastify.logDbError('board', 'board', '게시판 등록 실패', error);
            throw error;
        }
    }

    async checkBeforDeleteBoard(id: number, password: string){
        const query = `
            SELECT 
                PASSWORD = ${this.algorithm}(?,${this.method}) AS IS_PASSWORD_CORRECT
            FROM 
                ${this.tableName}
            WHERE ID = ?
        `

        try{
            const [rows] = await this.db.query<RowDataPacket[]>(query, [password, id]);
            return rows[0].IS_PASSWORD_CORRECT;
        }catch(error){
            this.fastify.logDbError('board', 'board', '게시판 삭제 전 비밀번호 확인 실패', error);
            throw error;
        }
    }

    async deleteBoard(id: number){
        const query = `
            DELETE FROM ${this.tableName} WHERE ID = ?
        `

        try{
            const [result] = await this.db.query<ResultSetHeader>(query, [id]);
            return result.affectedRows;
        }catch(error){
            this.fastify.logDbError('board', 'board', '게시판 삭제 실패', error);
            throw error;
        }
    }

    async updateBoard(id: number, title: string, content: string){
        const query = `
            UPDATE ${this.tableName}
            SET
                TITLE = CONCAT('[수정됨] ',?),
                CONTENT = ?,
                UPDATED_AT = NOW()
            WHERE ID = ?
        `

        try{
            const [result] = await this.db.query<ResultSetHeader>(query, [title, content, id]);
            return result.affectedRows;
        }catch(error){
            this.fastify.logDbError('board', 'board', '게시판 수정 실패', error);
            throw error;
        }
    }

}