import http from 'http';
import { createApp } from './app';
import { env, validateEnv } from './config/env';
import { database } from './config/database';
import { socketService } from './sockets';
import { logger } from './utils/logger';

/**
 * Server Entry Point
 * Initializes database, socket.io, and starts the HTTP server
 */

async function startServer(): Promise<void> {
  try {
    // Validate environment variables
    validateEnv();

    // Connect to database
    await database.connect();

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const httpServer = http.createServer(app);

    // Initialize Socket.IO
    socketService.initialize(httpServer);

    // Start server
    httpServer.listen(env.port, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 HUBBLE BACKEND SERVER STARTED                           ║
║                                                               ║
║   Environment: ${env.nodeEnv.padEnd(44)}║
║   Port: ${String(env.port).padEnd(51)}║
║   API Docs: http://localhost:${env.port}/api/docs${' '.repeat(24)}║
║   Health: http://localhost:${env.port}/api/health${' '.repeat(24)}║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
      `);
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received, shutting down gracefully...`);

      httpServer.close(async () => {
        logger.info('HTTP server closed');

        await database.disconnect();
        logger.info('Database disconnected');

        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();
