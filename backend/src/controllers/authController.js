import db from "../config/db.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

// Mock user data for when database is not available
const mockUsers = [
  {
    id: 1,
    email: 'test@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6ukx.LrUpm', // password123
    displayName: 'Test User',
    points: 0,
    grade_level_id: 5
  }
];

// Helper function to get mock user by email
const getMockUser = (email) => {
  return mockUsers.find(user => user.email === email);
};

// Helper function to check if database is available
const isDatabaseAvailable = () => {
  try {
    return db && db.query;
  } catch (error) {
    return false;
  }
};

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

    // Check if database is available
    if (!isDatabaseAvailable()) {
      console.log('Database not available, using mock registration');
      
      // Check if user already exists in mock data
      const existingUser = getMockUser(email);
      if (existingUser) {
        return res.status(409).json({ error: "User already exists" });
      }
      
      // Create mock user (in real app, this would save to database)
      const hashedPassword = await bcrypt.hash(password, config.BCRYPT_ROUNDS);
      const newUser = {
        id: mockUsers.length + 1,
        email,
        password: hashedPassword,
        displayName: email.split('@')[0],
        points: 0,
        grade_level_id: null
      };
      
      mockUsers.push(newUser);
      
      const token = jwt.sign(
        { id: newUser.id, email: newUser.email },
        config.jwtConfig.secret,
        { expiresIn: config.jwtConfig.expiresIn }
      );

      return res.status(201).json({
        message: "User registered successfully",
        user: {
          id: newUser.id,
          email: newUser.email,
          displayName: newUser.displayName,
          points: newUser.points,
          gradeLevelId: newUser.grade_level_id
        },
        token
      });
    }

    // Database is available, proceed with normal registration
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

    // Check if database is available
    if (!isDatabaseAvailable()) {
      console.log('Database not available, using mock login');
      
      const mockUser = getMockUser(email);
      if (!mockUser) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const isPasswordValid = await bcrypt.compare(password, mockUser.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      const token = jwt.sign(
        { id: mockUser.id, email: mockUser.email },
        config.jwtConfig.secret,
        { expiresIn: config.jwtConfig.expiresIn }
      );

      return res.json({
        message: "Login successful",
        user: {
          id: mockUser.id,
          email: mockUser.email,
          displayName: mockUser.displayName,
          points: mockUser.points,
          gradeLevelId: mockUser.grade_level_id
        },
        token
      });
    }

    // Database is available, proceed with normal login
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