import { FastifyInstance } from "fastify";
import { BoardRepository } from "../repositories/board.repository.js";

export class BoardService {
    private boardRepository: BoardRepository;
    public constructor(boardRepository: BoardRepository, private readonly fastify: FastifyInstance) {
        this.boardRepository = boardRepository;
    }

    async getTotalCount(){
        const result = await this.boardRepository.getTotalCount();
        return result;
    }

    async getList(pageNum: number, rowsPerPage: number) {
        const result = await this.boardRepository.getList(pageNum, rowsPerPage);
        return result;
    }

    async getDetail(id : number){
        const result = await this.boardRepository.getDetail(id);
        if(!result){
            return {
                statusCode : 422,
                error : 'NOT_FOUND'
            }
        }else{
            return {
                statusCode : 200,
                result : result
            }
        }
    }

    async insertBoard(title: string, content: string, writer: string, password: string){
        const result = await this.boardRepository.InsertBoard(title, content, writer, password);
        return {
            statusCode : 201,
            result : result
        }
    }

    async checkBoardPassword(id: number, password: string){
        const result = await this.boardRepository.checkBeforDeleteBoard(id, password);
        return result;
    }

    async deleteBoard(id: number, password: string){
        const isPasswordCorrect = await this.checkBoardPassword(id, password);
        if(!isPasswordCorrect){
            return {
                statusCode : 422,
                error : 'INVALID_PASSWORD'
            }
        }else{
            const result = await this.boardRepository.deleteBoard(id);
            return {
                statusCode : 200,
                result : result
            }
        }
    }

    async updateBoard(id: number, title: string, content: string, password: string){
        const isPasswordCorrect = await this.checkBoardPassword(id, password);
        if(!isPasswordCorrect){
            return {
                statusCode : 422,
                error : 'INVALID_PASSWORD'
            }
        }else{
            const result = await this.boardRepository.updateBoard(id, title, content);
            return {
                statusCode : 200,
                result : result
            }
        }
    }
}

