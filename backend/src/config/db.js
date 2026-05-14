import mysql from 'mysql2';
import config from './index.js';

config.validate();

const pool = mysql.createPool(config.dbConfig);

const testConnection = async () => {
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        globalThis.appLogger.error('Database connection failed:', err.message);
        reject(err);
        return;
      }

      connection.release();
      resolve(true);
    });
  });
};

const queryCallback = (sql, params = [], callback) => {
  pool.execute(sql, params, (error, results) => {
    if (error) {
      globalThis.appLogger.error('Database query error:', error);
      return callback(error);
    }
    callback(null, results);
  });
};

const query = async (sql, params = []) => {
  return new Promise((resolve, reject) => {
    pool.execute(sql, params, (error, results) => {
      if (error) {
        globalThis.appLogger.error('Database query error:', error);
        reject(error);
        return;
      }
      resolve(results);
    });
  });
};

const transactionCallback = (callback) => {
  pool.getConnection((err, connection) => {
    if (err) {
      return callback(err);
    }

    connection.beginTransaction((transactionError) => {
      if (transactionError) {
        connection.release();
        return callback(transactionError);
      }

      callback(null, connection, (commitErr) => {
        if (commitErr) {
          connection.rollback(() => {
            connection.release();
            callback(commitErr);
          });
        } else {
          connection.commit((finalError) => {
            connection.release();
            callback(finalError);
          });
        }
      });
    });
  });
};

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
          result
            .then((asyncResult) => {
              done(null);
              resolve(asyncResult);
            })
            .catch((asyncErr) => {
              done(asyncErr);
              reject(asyncErr);
            });
        } else {
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

const getPoolStatus = () => {
  return {
    totalConnections: pool._allConnections ? pool._allConnections.length : 0,
    freeConnections: pool._freeConnections ? pool._freeConnections.length : 0,
    acquiringConnections: pool._acquiringConnections ? pool._acquiringConnections.length : 0,
    connectionLimit: config.dbConfig.connectionLimit
  };
};

const closePool = async () => {
  return new Promise((resolve) => {
    pool.end((err) => {
      if (err && !err.message?.includes('closed state')) {
        globalThis.appLogger.error('Error closing database pool:', err.message);
      }
      resolve();
    });
  });
};

const db = {
  execute: queryCallback,
  query: queryCallback,
  getConnection: (callback) => pool.getConnection(callback),
  queryAsync: query,
  transactionAsync: transaction,
  testConnection,
  getPoolStatus,
  closePool,
  pool
};

export default db;
