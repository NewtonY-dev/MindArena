import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createUser, createUserWithDefaultSubjects, checkEmailExists, getUserAuthByEmail } from '../models/user.model.js';
import {getGradeLevelById} from '../models/gradeLevel.model.js';
import config from '../config/index.js';

export const registerUser = async (req, res) => {
  try {
    // Defensive check for req.body
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: "Invalid request body" });
    }
    
    const { email, password, gradeLevelId } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    if(!gradeLevelId) {
      return res.status(400).json({ error: "Grade level is required" });
    }

    const userExists = await checkEmailExists(email);
    if (userExists) {
      return res.status(409).json({ error: "User already exists" });
    }

    // Validate grade exists
    const grade = await getGradeLevelById(gradeLevelId);
    if (!grade) {
      return res.status(400).json({ error: "Invalid grade level" });
    }

    const displayName = email.split('@')[0];
    const hashedPassword = await bcrypt.hash(password, config.BCRYPT_ROUNDS);

    // Create user + assign default subjects in one transaction
    const {userId, subjectIds} = await createUserWithDefaultSubjects({
      email,
      passwordHash: hashedPassword,
      displayName,
      gradeLevelId
    });

    const token = jwt.sign(
      { id: userId, email },
      config.jwtConfig.secret,
      { expiresIn: config.jwtConfig.expiresIn }
    );

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: userId,
        email,
        displayName,
        gradeLevelId,
        subjectIds,
        points: 0,
        role: 'user',
        isProfileComplete: true
      },
      token
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

    const user = await getUserAuthByEmail(email);

    if (!user) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

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
        role: user.role,
        isProfileComplete: user.grade_level_id !== null && user.subject_count > 0
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
};
