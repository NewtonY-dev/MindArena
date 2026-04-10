import mysql from 'mysql2'; // Use callback version for backward compatibility
import config from './index.js';

// Validate configuration
config.validate();

// Create connection pool with callback interface
const pool = mysql.createPool(config.dbConfig);

// Test database connection
const testConnection = async () => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        console.error('❌ Database connection failed:', err.message);
        reject(err);
        return;
      }
      console.log('✅ Database connected successfully');
      connection.release();
      resolve(true);
    });
  });
};

// Execute query with callback (for existing models)
const queryCallback = (sql, params = [], callback) => {
  pool.execute(sql, params, (error, results) => {
    if (error) {
      console.error('Database query error:', error);
      return callback(error);
    }
    callback(null, results);
  });
};

// Execute query with promise (for new code)
const query = async (sql, params = []) => {
  return new Promise((resolve, reject) => {
    pool.execute(sql, params, (error, results) => {
      if (error) {
        console.error('Database query error:', error);
        reject(error);
        return;
      }
      resolve(results);
    });
  });
};

// Transaction helper (callback-based for existing models)
const transactionCallback = (callback) => {
  pool.getConnection((err, connection) => {
    if (err) {
      return callback(err);
    }
    
    connection.beginTransaction((err) => {
      if (err) {
        connection.release();
        return callback(err);
      }
      
      callback(null, connection, (commitErr) => {
        if (commitErr) {
          connection.rollback(() => {
            connection.release();
            callback(commitErr);
          });
        } else {
          connection.commit((err) => {
            connection.release();
            callback(err);
          });
        }
      });
    });
  });
};

// Transaction helper (promise-based for new code)
const transaction = async (callback) => {
  return new Promise((resolve, reject) => {
    transactionCallback((err, connection, done) => {
      if (err) {
        reject(err);
        return;
      }
      
      try {
        const result = callback(connection);
        if (result && typeof result.then === 'function') {
          // Handle async callback
          result
            .then(asyncResult => {
              done(null);
              resolve(asyncResult);
            })
            .catch(asyncErr => {
              done(asyncErr);
              reject(asyncErr);
            });
        } else {
          // Handle sync callback
          done(null);
          resolve(result);
        }
      } catch (error) {
        done(error);
        reject(error);
      }
    });
  });
};

// Get connection pool status
const getPoolStatus = () => {
  return {
    totalConnections: pool._allConnections ? pool._allConnections.length : 0,
    freeConnections: pool._freeConnections ? pool._freeConnections.length : 0,
    acquiringConnections: pool._acquiringConnections ? pool._acquiringConnections.length : 0,
    connectionLimit: config.dbConfig.connectionLimit,
  };
};

// Graceful shutdown
const closePool = async () => {
  return new Promise((resolve) => {
    pool.end((err) => {
      if (err && !err.message?.includes('closed state')) {
        console.error('Error closing database pool:', err.message);
      }
      // Resolve even on error - connections may already be closed
      console.log('🔌 Database connection pool closed');
      resolve();
    });
  });
};

// Export the database connection with callback interface for existing models
const db = {
  // Callback-based methods (for existing models)
  execute: queryCallback,
  query: queryCallback,
  getConnection: (callback) => pool.getConnection(callback),
  
  // Promise-based methods (for new code)
  queryAsync: query,
  transactionAsync: transaction,
  testConnection,
  getPoolStatus,
  closePool,
  
  // Pool access
  pool,
};

// Export default
export default db;