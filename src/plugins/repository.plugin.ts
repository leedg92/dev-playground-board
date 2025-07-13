// plugins/basicServicePlugin.ts
import { FastifyPluginAsync} from 'fastify';
import fp from 'fastify-plugin';
import { BoardRepository } from '../repositories/board.repository.js';

const repositoryPlugin: FastifyPluginAsync = async (fastify) => {
    fastify.decorate('repository', {
        boardRepository : new BoardRepository(fastify),
    });
};

export default fp(repositoryPlugin, {
    name: 'repositoryPlugin',
    dependencies: ['db','logger']
});
