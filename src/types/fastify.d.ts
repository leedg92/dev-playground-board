import { BoardRepository } from '../repositories/board.repository.js';
import { BoardService } from '../services/board.service.js';

import { Pool } from 'mysql2/promise';

export interface SchedulerTask {
    name: string;
    pattern: string;
    scheduled: boolean;
    running: boolean;
    description: string;
  }
  
  export interface Scheduler {
    list: () => SchedulerTask[];
    updatePattern: (name: string, newPattern: string) => boolean;
    start: (name: string) => boolean;
    stop: (name: string) => boolean;
    status: (name: string) => SchedulerTask | null;
    getAllTasks: () => Map<string, any>;
  }

  
  declare module 'fastify' {
    interface FastifyInstance {
      config: {
        NODE_ENV: string;
        PORT: number;
        HOST: string;
        API_PREFIX: string;
        ENABLE_SWAGGER: boolean;
      };
      boardDb:   Pool;
      repository: {
        boardRepository: BoardRepository;
      };
      services: {
        boardService: BoardService;
      };
      schedule: {
        services: {
          boardService: BoardService;
        };
      };
      logWithContext: (level: string, message: string, context?: Record<string, any>) => void;
      logPerformance?: (event: string, durationMs: number, context?: Record<string, any>) => void;
      logDbError: (db: string, table: string, message: string, error: any) => void;
    }
  } 
  
  export interface PredefinedTask {
    name: string;
    description: string;
    defaultPattern: string;
    task: () => Promise<void>;
  }
