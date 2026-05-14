import logger from './src/config/logger.js';
import config from './src/config/index.js';
import db from './src/config/db.js';
import setupDatabase from './src/config/initDatabase.js';
import app from './src/app.js';
import { initializeSocketServer } from './src/config/socketServer.js';

const PORT = config.PORT;

const startServer = async () => {
  try {
    await db.testConnection();
    await setupDatabase();

    const server = app.listen(PORT, () => {
      logger.startup(`Server running on port ${PORT}`);
      logger.startup('Database connected');
      logger.startup('Socket.io initialized');
    });

    initializeSocketServer(server);

    const gracefulShutdown = () => {
      server.close(async () => {
        try {
          if (db.pool) {
            await db.closePool();
          }
        } catch (error) {
          logger.error('Error closing database pool:', error.message);
        }
      });

      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 1500000);
    };

    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown();
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown();
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
