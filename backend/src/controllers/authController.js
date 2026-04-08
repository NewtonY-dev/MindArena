import db from "../config/db.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, getUserByEmail } from '../models/user.model.js';
import config from '../config/index.js';

export const registerUser = async (req, res) => {
  try {
    // Defensive check for req.body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: "Invalid request body" });
    }
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Database registration
    const checkUserSql = 'SELECT id FROM users WHERE email = ?';
    
    db.query(checkUserSql, [email], async (err, results) => {
      if (err) {
        console.error('Database error during registration check:', err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results.length > 0) {
        return res.status(409).json({ error: "User already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, config.BCRYPT_ROUNDS);
      
      const insertUserSql = `
        INSERT INTO users (email, password_hash, display_name, points, created_at) 
        VALUES (?, ?, ?, ?, NOW())
      `;
      
      db.query(insertUserSql, [email, hashedPassword, email.split('@')[0], 0], (err, result) => {
        if (err) {
          console.error('Database error during user creation:', err);
          return res.status(500).json({ error: "Internal server error" });
        }

        const token = jwt.sign(
          { id: result.insertId, email },
          config.jwtConfig.secret,
          { expiresIn: config.jwtConfig.expiresIn }
        );

        res.status(201).json({
          message: "User registered successfully",
          user: {
            id: result.insertId,
            email,
            displayName: email.split('@')[0],
            points: 0
          },
          token
        });
      });
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const loginUser = async (req, res) => {
  try {
    // Defensive check for req.body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: "Invalid request body" });
    }
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Database login
    const getUserSql = 'SELECT id, email, password_hash, display_name, points, grade_level_id, role FROM users WHERE email = ?';
    
    db.query(getUserSql, [email], async (err, results) => {
      if (err) {
        console.error('Database error during login:', err);
        return res.status(500).json({ error: "Internal server error" });
      }

      if (results.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = results[0];
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        config.jwtConfig.secret,
        { expiresIn: config.jwtConfig.expiresIn }
      );

      res.json({
        message: "Login successful",
        user: {
          id: user.id,
          email: user.email,
          displayName: user.display_name,
          points: user.points,
          gradeLevelId: user.grade_level_id,
          role: user.role
        },
        token
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};