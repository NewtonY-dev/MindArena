import express from "express";
import { getQuestions, submitAnswer, getCorrectlyAnsweredQuestions, getProgress } from "../controllers/practiceController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// List Practice Questions (with optional subject filter) - excludes correctly answered
router.get("/questions", authMiddleware, getQuestions);

// Submit Answer & Get Instant Feedback
router.post("/submit", authMiddleware, submitAnswer);

// Get user's correctly answered questions history (review section)
router.get("/history", authMiddleware, getCorrectlyAnsweredQuestions);

// Get user's progress (overall or subject-specific)
router.get("/progress", authMiddleware, getProgress);

export default router;