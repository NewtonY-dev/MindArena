/**
 * Database helper utilities
 * Shared functions for database availability checks and common operations
 */

import db from '../config/db.js';

/**
 * Check if database connection is available and functional
 * @returns {boolean} True if database is available
 */
export const isDatabaseAvailable = () => {
  try {
    return db && typeof db.query === 'function';
  } catch (error) {
    return false;
  }
};

/**
 * Safely execute a database query with fallback
 * @param {Function} dbOperation - Async function that performs DB operation
 * @param {*} fallbackValue - Value to return if DB operation fails
 * @returns {*} Result of dbOperation or fallbackValue
 */
export const withDatabaseFallback = async (dbOperation, fallbackValue) => {
  if (!isDatabaseAvailable()) {
    console.log('Database not available, using fallback');
    return fallbackValue;
  }

  try {
    return await dbOperation();
  } catch (error) {
    console.error('Database operation failed:', error.message);
    return fallbackValue;
  }
};

/**
 * Test database connection
 * @returns {Promise<boolean>} True if connection successful
 */
export const testConnection = async () => {
  try {
    if (!isDatabaseAvailable()) {
      return false;
    }
    await db.promise().query('SELECT 1');
    return true;
  } catch (error) {
    return false;
  }
};
