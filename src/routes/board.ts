import { FastifyPluginAsync } from 'fastify';
import { listSchema, detailSchema, insertSchema, deleteSchema, updateSchema, checkPasswordSchema, searchSchema } from '../schemas/board.schema.js';
/**
 * 메모리 모니터링 데이터 조회
 */
const BoardRoutes: FastifyPluginAsync = async (fastify): Promise<void> => {
    fastify.post('/list', {
        schema: listSchema,

    }, async (request, reply) => {
        const { pageNum, rowsPerPage, search = '' } = request.body as { pageNum: number; rowsPerPage: number; search: string };
        const totalCount = await fastify.services.boardService.getTotalCount(search);
        const result = await fastify.services.boardService.getList(pageNum, rowsPerPage, search);
        return reply.status(200).send({
            result: result,
            totalCount : totalCount,
            totalPages : Math.ceil(totalCount / rowsPerPage)
        });
    });


    fastify.post('/detail',{
        schema: detailSchema,
    }, async (request, reply) => {
        const {id} = request.body as {id : number};
        const result = await fastify.services.boardService.getDetail(id);
        return reply.status(result.statusCode).send(result);
    })

    fastify.post('/insert',{
        schema : insertSchema,
    }, async (request, reply) => {
        const {title, content, writer, password} = request.body as {title: string, content: string, writer: string, password: string};
        const result = await fastify.services.boardService.insertBoard(title, content, writer, password);
        return reply.status(result.statusCode).send(result);
    })

    fastify.post('/checkPassword',{
        schema : checkPasswordSchema,
    }, async (request, reply) => {
        const {id, password} = request.body as {id: number, password: string};
        const result = await fastify.services.boardService.checkBoardPassword(id, password);
        return reply.status(result.statusCode).send(result);
    })  

    fastify.post('/delete',{
        schema : deleteSchema,
    }, async (request, reply) => {
        const {id, password} = request.body as {id: number, password: string};
        const result = await fastify.services.boardService.deleteBoard(id, password);
        return reply.status(result.statusCode).send(result);
    })

    fastify.post('/update',{
        schema : updateSchema,
    }, async (request, reply) => {
        const {id, title, content, password} = request.body as {id: number, title: string, content: string, password: string};
        const result = await fastify.services.boardService.updateBoard(id, title, content, password);
        return reply.status(result.statusCode).send(result);
    })
};

export default BoardRoutes;