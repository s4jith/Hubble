import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';

import { env } from './config/env';
import { swaggerSpec } from './docs';
import routes from './routes';
import { errorHandler, notFoundHandler, apiRateLimiter } from './middlewares';
import { logger } from './utils/logger';

/**
 * Express Application Factory
 * Creates and configures the Express application
 * 
 * SECURITY FEATURES:
 * - Helmet for security headers
 * - CORS configuration
 * - Rate limiting
 * - Request logging (sanitized)
 */
export function createApp(): Application {
  const app = express();

  // Trust proxy for rate limiting behind reverse proxy
  app.set('trust proxy', 1);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS
  app.use(cors({
    origin: env.nodeEnv === 'production'
      ? ['https://hubble.app', 'https://www.hubble.app']
      : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  if (env.nodeEnv !== 'test') {
    app.use(morgan('combined', {
      stream: {
        write: (message: string) => logger.info(message.trim()),
      },
      skip: (req: Request) => req.path === '/api/health',
    }));
  }

  // Rate limiting
  app.use('/api', apiRateLimiter);

  // Swagger documentation
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Hubble API Documentation',
  }));

  // Swagger JSON endpoint
  app.get('/api/docs.json', (_req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  // API routes
  app.use('/api', routes);

  // Root redirect to API docs
  app.get('/', (_req: Request, res: Response) => {
    res.redirect('/api/docs');
  });

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}

export default createApp;
