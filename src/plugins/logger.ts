// src/plugins/logger.ts
import fp from 'fastify-plugin';
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import { formatKSTLocale, formatDuration } from '../utils/time.js';

declare module 'fastify' {
  interface FastifyInstance {
    logWithContext: (level: string, message: string, context?: Record<string, any>) => void;
    logRequest: (request: FastifyRequest, additionalInfo?: Record<string, any>) => void;
    logResponse: (request: FastifyRequest, reply: FastifyReply, responseTime: number, additionalInfo?: Record<string, any>) => void;
    logPerformance?: (event: string, durationMs: number, context?: Record<string, any>) => void;
    logSecurity?: (event: string, context?: Record<string, any>) => void;
  }
}

const loggerPlugin: FastifyPluginAsync = async (fastify): Promise<void> => {
  fastify.decorate('logWithContext', function (level: string, message: string, context: Record<string, any> = {}) {
    if (['debug', 'info', 'warn', 'error'].includes(level)) {
      this.log[level as 'debug' | 'info' | 'warn' | 'error']({
        ...context,
        service: 'healthcheck',
        timestamp: formatKSTLocale()
      }, message);
    }
  });

  fastify.decorate('logDbError', function (db: string = 'healthcheck', table: string, message:string, error: any) {
    //연결 에러(ECONNREFUSED, PROTOCOL_CONNECTION_LOST, ER_ACCESS_DENIED_ERROR)
    //sql 에러(ER_PARSE_ERROR, ER_BAD_FIELD_ERROR, ER_BAD_NULL_ERROR,ER_DUP_ENTRY )
    //lock 에러(ER_LOCK_DEADLOCK, ER_LOCK_WAIT_TIMEOUT)
    this.log.error({
      db: db,
      table: table,
      errorCode: error.code,
    }, error.sqlMessage,);
  });


  fastify.decorate('logRequest', (request: FastifyRequest, additionalInfo: Record<string, any> = {}) => {
    fastify.log.info({
      requestId: request.id,
      method: request.method,
      url: request.url,
      userAgent: request.headers['user-agent'], //없애야 할 수도 
      ip: request.ip,
      timestamp: formatKSTLocale(),
      ...additionalInfo
    }, 'Request received');
  });

  fastify.decorate('logResponse', (request: FastifyRequest, reply: FastifyReply, responseTime: number, additionalInfo: Record<string, any> = {}) => {
    fastify.log.info({
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: formatDuration(responseTime),
      timestamp: formatKSTLocale(),
      ...additionalInfo
    }, 'Request completed');
  });

  fastify.decorate('logPerformance', (event: string, durationMs: number, context: Record<string, any> = {}) => {
    const level: 'debug' | 'info' | 'warn' = durationMs > 5000 ? 'warn' : durationMs > 1000 ? 'info' : 'debug';
    const durationFormatted = formatDuration(durationMs);

    fastify.log[level]({
      operation: event,
      duration: durationFormatted,
      durationMs,
      performance: true,
      timestamp: formatKSTLocale(),
      ...context
    }, `Operation ${event} completed in ${durationFormatted}`);
  });

  fastify.decorate('logSecurity', (event: string, context: Record<string, any> = {}) => {
    fastify.log.warn({
      securityEvent: event,
      timestamp: formatKSTLocale(),
      ...context
    }, `Security event: ${event}`);
  });

  if (process.env.ENABLE_REQUEST_LOGGING !== 'false') {
    fastify.addHook('onRequest', async (request) => {
      if (request.url !== '/health') {
        (request as any).startTime = Date.now();
        fastify.logRequest(request);
      }
    });

    fastify.addHook('onResponse', async (request, reply) => {
      if (request.url !== '/health') {
        const responseTime = (request as any).startTime ? Date.now() - (request as any).startTime : 0;
        fastify.logResponse(request, reply, responseTime);
      }
    });
  }

  fastify.addHook('onError', async (request, reply, error) => {
    const responseTime = (request as any).startTime ? Date.now() - (request as any).startTime : 0;

    fastify.log.error({
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      responseTime: formatDuration(responseTime),
      timestamp: formatKSTLocale(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      }
    }, 'Request error occurred');
  });

  fastify.log.info('Logger plugin loaded with configuration:', {
    environment: process.env.NODE_ENV,
    logLevel: process.env.LOG_LEVEL || 'info',
    requestLogging: process.env.ENABLE_REQUEST_LOGGING !== 'false'
  });
};

export default fp(loggerPlugin, {
  name: 'logger',
  dependencies: []
});
