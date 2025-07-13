import Fastify from 'fastify';
import closeWithGrace from 'close-with-grace';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 로거 설정 함수
function createLoggerConfig() {
  const logLevel = process.env.LOG_LEVEL || 'info';
  const logToFile = process.env.LOG_TO_FILE === 'true';
  const isDevelopment = process.env.NODE_ENV === 'development';

  const baseConfig = {
    level: logLevel,
    timestamp: () => {
      const now = new Date();
      const kstOffset = 9 * 60 * 60 * 1000;
      const kstTime = new Date(now.getTime() + kstOffset);
      return `,"timestamp":"${kstTime.toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\. /g, '-').replace(/\./g, '').replace(', ', ' ')}"`;
    }
  };

  // 파일 로그 설정
  if (logToFile) {
    const logFile = process.env.LOG_FILE || './logs/app.log';
    const errorLogFile = process.env.LOG_ERROR_FILE || './logs/error.log';
    
    return {
      ...baseConfig,
      transport: {
        targets: [
          // 모든 로그를 파일에 저장
          {
            target: 'pino/file',
            options: {
              destination: logFile,
              mkdir: true
            }
          },
          // 에러 로그만 별도 파일에 저장
          {
            target: 'pino/file', 
            level: 'error',
            options: {
              destination: errorLogFile,
              mkdir: true
            }
          },
          // 콘솔에도 출력 (개발환경에서는 pretty)
          ...(isDevelopment ? [{
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
              ignore: 'pid,hostname,reqId',
              messageFormat: '{time} [{level}] {msg}',
              hideObject: false,
            }
          }] : [{
            target: 'pino/file',
            options: {
              destination: 1 // stdout
            }
          }])
        ]
      }
    };
  }

  // 파일 로그 비활성화 시 기존 설정
  return {
    ...baseConfig,
    transport: isDevelopment ? {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
        ignore: 'pid,hostname,reqId',
        messageFormat: '{time} [{level}] {msg}',
        hideObject: false,
      }
    } : undefined
  };
}

const fastify = Fastify({
  logger: createLoggerConfig(),
  trustProxy: true,
  bodyLimit: 10 * 1024 * 1024,
  keepAliveTimeout: 30000,
  connectionTimeout: 10000
});
//환경변수 등록 플러그인 > fastify.config.환경변수이름으로 사용 가능 
await fastify.register(import('@fastify/env'), {
  confKey: 'config',
  schema: {
    type: 'object',
    required: ['NODE_ENV'],
    properties: {
      NODE_ENV: { type: 'string', default: 'development' },
      PORT: { type: 'integer', default: 3000 },
      HOST: { type: 'string', default: '0.0.0.0' },
      API_PREFIX: { type: 'string', default: '/api' },
      ENABLE_SCHEDULER: { type: 'boolean', default: true },
      ENABLE_SWAGGER: { type: 'boolean', default: true }
    }
  }
});

await fastify.register(import('@fastify/helmet'), {
  contentSecurityPolicy: false
});

await fastify.register(import('@fastify/cors'), {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400,
  preflight: true
});

await fastify.register(import('@fastify/rate-limit'), {
  max: 100,
  timeWindow: '1 minute'
});

//개발환경에서만 swagger 등록 
if (fastify.config.ENABLE_SWAGGER && fastify.config.NODE_ENV === 'development') {
  await fastify.register(import('@fastify/swagger'), {
    openapi: {
      info: {
        title: 'HealthCheck API Server',
        description: 'HealthCheck API server with scheduler support',
        version: '1.0.0'
      },
      servers: [{
        url: `http://${fastify.config.HOST === '0.0.0.0' ? 'localhost' : fastify.config.HOST}:${fastify.config.PORT}`
      }]
    }
  });

  await fastify.register(import('@fastify/swagger-ui'), {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
      tryItOutEnabled: true
    },
    staticCSP: false,
    transformStaticCSP: (header) => header
  });
}

// 플러그인 직접 로드
await fastify.register(import('./plugins/logger.js'));
await fastify.register(import('./plugins/utils/mariadb.plugin.js'));
await fastify.register(import('./plugins/repository.plugin.js'));
await fastify.register(import('./plugins/apiService.plugin.js'));
// routes 디렉토리에 있는 모든 파일 자동으로 plugin 등록 > api 
await fastify.register(import('@fastify/autoload'), {
  dir: join(__dirname, 'routes'),
  options: { prefix: fastify.config.API_PREFIX }
});

fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0'
  };
});


//에러 핸들러 
fastify.setNotFoundHandler((request, reply) => {
  return reply.status(404).send({
    statusCode: 404,
    error: 'Not Found',
    message: `Route ${request.method}:${request.url} not found`
  });
});

fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);

  if ((error as any).validation) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Bad Request',
      message: 'Validation failed',
      details: (error as any).validation
    });
  }

  if ((error as any).statusCode >= 500) {
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }

  return reply.status((error as any).statusCode || 500).send({
    statusCode: (error as any).statusCode || 500,
    error: error.name || 'Error',
    message: error.message
  });
});

const start = async () => {
  try {
    const address = await fastify.listen({
      port: fastify.config.PORT,
      host: fastify.config.HOST
    });
    fastify.log.info(`🚀 Server listening on ${address}`);
    if (fastify.config.ENABLE_SWAGGER && fastify.config.NODE_ENV === 'development') {
      fastify.log.info(`📚 Swagger docs available at ${address}/docs`);
    }
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

closeWithGrace({ delay: 10000 }, async ({ signal, err }) => {
  if (err) {
    fastify.log.error(err, 'Server closing due to error');
  } else {
    fastify.log.info(`Received ${signal}, closing server gracefully`);
  }
  await fastify.close();
});

start();
