import express from "express";
import { getQuestions, submitAnswer } from "../controllers/practiceController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// List Practice Questions (with optional subject filter)
router.get("/questions", authMiddleware, getQuestions);

// Submit Answer & Get Instant Feedback
router.post("/submit", authMiddleware, submitAnswer);

export default router;