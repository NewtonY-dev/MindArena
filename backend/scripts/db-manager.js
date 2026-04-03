#!/usr/bin/env node

import { program } from 'commander';
import setupDatabase, { checkDatabaseHealth, resetDatabase } from '../src/config/initDatabase.js';
import config from '../src/config/index.js';

// Set up CLI program
program
  .name('db-manager')
  .description('MindArena Database Management Tool')
  .version('1.0.0');

// Initialize database command
program
  .command('init')
  .description('Initialize database with tables and seed data')
  .action(async () => {
    try {
      await setupDatabase();
      console.log('🎉 Database initialization completed successfully!');
    } catch (error) {
      console.error('❌ Database initialization failed:', error.message);
      process.exit(1);
    }
  });

// Check database health command
program
  .command('health')
  .description('Check database connection and health')
  .action(async () => {
    try {
      const isHealthy = await checkDatabaseHealth();
      if (isHealthy) {
        console.log('✅ Database is healthy and ready to use!');
      } else {
        console.log('❌ Database health check failed');
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
      process.exit(1);
    }
  });

// Reset database command
program
  .command('reset')
  .description('Reset database (development only)')
  .option('-f, --force', 'Force reset without confirmation')
  .action(async (options) => {
    if (config.NODE_ENV === 'production') {
      console.error('❌ Database reset is not allowed in production environment');
      process.exit(1);
    }

    if (!options.force) {
      console.log('⚠️  This will reset the entire database. All data will be lost.');
      console.log('📊 Database:', config.DB_NAME);
      console.log('🌍 Environment:', config.NODE_ENV);
      
      const readline = await import('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      const answer = await new Promise((resolve) => {
        rl.question('Are you sure you want to continue? (yes/no): ', resolve);
      });

      rl.close();

      if (answer.toLowerCase() !== 'yes') {
        console.log('❌ Database reset cancelled');
        return;
      }
    }

    try {
      await resetDatabase();
      console.log('🎉 Database reset completed successfully!');
    } catch (error) {
      console.error('❌ Database reset failed:', error.message);
      process.exit(1);
    }
  });

// Show database info command
program
  .command('info')
  .description('Show database configuration')
  .action(() => {
    console.log('📊 MindArena Database Information:');
    console.log('=====================================');
    console.log('🏷️  Database Name:', config.DB_NAME);
    console.log('🌐 Host:', config.DB_HOST);
    console.log('🔌 Port:', config.DB_PORT);
    console.log('👤 User:', config.DB_USER);
    console.log('🌍 Environment:', config.NODE_ENV);
    console.log('🔗 Connection URL:', config.DATABASE_URL.replace(/:([^:@]+)@/, ':***@'));
    console.log('🏊 Connection Pool Limit:', config.dbConfig.connectionLimit);
    console.log('⏱️  Connection Timeout:', config.dbConfig.timeout + 'ms');
    console.log('=====================================');
  });

// Create database command (MySQL specific)
program
  .command('create')
  .description('Create the database (MySQL only)')
  .action(async () => {
    try {
      const mysql = await import('mysql2/promise');
      
      // Connect without specifying database
      const connection = await mysql.createConnection({
        host: config.DB_HOST,
        user: config.DB_USER,
        password: config.DB_PASSWORD,
        port: config.DB_PORT
      });

      console.log(`🏗️  Creating database: ${config.DB_NAME}`);
      
      await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${config.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      
      console.log('✅ Database created successfully!');
      console.log('💡 You can now run: npm run db:init');
      
      await connection.end();
      
    } catch (error) {
      console.error('❌ Failed to create database:', error.message);
      
      if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        console.log('\n💡 Possible solutions:');
        console.log('   1. Check your database credentials');
        console.log('   2. Ensure the user has CREATE DATABASE privileges');
        console.log('   3. Try running as root user');
      }
      
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
