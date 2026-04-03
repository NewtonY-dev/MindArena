import config from './src/config/index.js';
import db from './src/config/db.js';
import setupDatabase from './src/config/initDatabase.js';
import app from './src/app.js';
import { initializeSocketServer } from './src/config/socketServer.js';

const PORT = config.PORT;

// Initialize database and start server
const startServer = async () => {
  try {
    console.log('🚀 Starting MindArena API Server...');
    console.log(`📊 Environment: ${config.NODE_ENV}`);
    console.log(`🔧 Port: ${PORT}`);
    
    // Test database connection with fallback
    try {
      await db.testConnection();
      console.log('✅ Database connection successful');
      
      // Setup database tables and seed data
      await setupDatabase();
      console.log('✅ Database setup completed');
    } catch (dbError) {
      console.log('⚠️ Database connection failed:', dbError.message);
      console.log('🔄 Starting server without database (limited functionality)');
      
      // Add a basic health check route that doesn't require database
      app.get('/health', (req, res) => {
        res.json({ 
          status: 'ok',
          message: 'Server running without database',
          timestamp: new Date().toISOString()
        });
      });
    }
    
    // Start the server
    const server = app.listen(PORT, () => {
      console.log(`✅ MindArena API server running on port ${PORT}`);
      console.log(`🌍 Environment: ${config.NODE_ENV}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}${config.API_PREFIX}/docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/`);
      console.log(`⚡ WebSocket Server: ws://localhost:${PORT}`);
      console.log('\n📋 Available Endpoints:');
      console.log(`   POST ${config.API_PREFIX}/auth/register - Register new user`);
      console.log(`   POST ${config.API_PREFIX}/auth/login - Login user`);
      console.log(`   GET  ${config.API_PREFIX}/users/me - Get current user profile`);
      console.log(`   GET  ${config.API_PREFIX}/practice/questions - Get practice questions`);
      console.log(`   POST ${config.API_PREFIX}/practice/submit - Submit answer`);
      console.log(`   POST ${config.API_PREFIX}/challenges/create - Create 1v1 challenge`);
      console.log(`   POST ${config.API_PREFIX}/challenges/join - Join challenge`);
      console.log('\n🔧 Note: Some endpoints may not work without database connection');
    });

    // Initialize Socket.io server
    initializeSocketServer(server);
    console.log('✅ WebSocket server initialized for 1v1 challenges');

    // Graceful shutdown
    const gracefulShutdown = (signal) => {
      console.log(`\n� Received ${signal}. Shutting down gracefully...`);
      
      server.close(async () => {
        console.log('� HTTP server closed');
        
        try {
          // Close database connection only if it was established
          if (db.pool) {
            await db.closePool();
            console.log('�️ Database connection closed');
          }
        } catch (error) {
          console.error('❌ Error closing database pool:', error.message);
        }
      });

      // Force close after 30 seconds
      setTimeout(() => {
        console.error('❌ Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    
    if (error.message.includes('Missing required environment variables')) {
      console.error('\n💡 Solution: Check your .env file and ensure all required variables are set:');
      console.error('   - DB_HOST');
      console.error('   - DB_USER');
      console.error('   - DB_PASSWORD');
      console.error('   - DB_NAME');
      console.error('   - JWT_SECRET');
    }
    
    if (error.message.includes('Database connection failed')) {
      console.error('\n💡 Solution: Check your database configuration and ensure MySQL is running');
    }
    
    process.exit(1);
  }
};

// Start the server
startServer();
