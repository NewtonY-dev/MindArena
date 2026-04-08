import config from './src/config/index.js';
import db from './src/config/db.js';
import setupDatabase from './src/config/initDatabase.js';
import app from './src/app.js';
import { initializeSocketServer } from './src/config/socketServer.js';

const PORT = config.PORT;

// Initialize database and start server
const startServer = async () => {
  try {
    console.log(`Starting server on port ${PORT}...`);
    
    // Test database connection
    await db.testConnection();
    console.log('Database connection successful');
    
    // Setup database tables and seed data
    await setupDatabase();
    console.log('Database setup completed');
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`Server ready on port ${PORT}`);
    });

    // Initialize Socket.io server
    initializeSocketServer(server);
    console.log('WebSocket server initialized for 1v1 challenges');

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      server.close(async () => {
        try {
          if (db.pool) await db.closePool();
        } catch (error) {
          console.error('Error closing database pool:', error.message);
        }
      });

      // Force close after 30 seconds
      setTimeout(() => {
        console.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    
    
    process.exit(1);
  }
};

// Start the server
startServer();
