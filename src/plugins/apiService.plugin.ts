import fp from 'fastify-plugin';
import { FastifyPluginAsync } from "fastify";
import { BoardService } from "../services/board.service.js";

const servicePlugin:FastifyPluginAsync = async (fastify) => {
    fastify.decorate('services', {
        boardService: new BoardService(fastify.repository.boardRepository, fastify),
    });
};

export default fp(servicePlugin, {
    name: 'servicePlugin',
    dependencies: ['repositoryPlugin','logger'],
});