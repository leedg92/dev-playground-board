// plugins/db.ts (TypeScript 기준)
import { FastifyPluginAsync } from 'fastify';
import mysql from 'mysql2/promise';
import fp from 'fastify-plugin';

const dbConnector: FastifyPluginAsync = async (fastify): Promise<void> => {

  const boardDBPool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
  });
  fastify.decorate('boardDb', boardDBPool);

  fastify.addHook('onClose', async () => {
    await boardDBPool.end();
  });
};

export default fp(dbConnector,{name: 'db'});
