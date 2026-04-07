import express from "express";
import { 
  getQuestionsByGrade, 
  getMyQuestions, 
  getQuestionByIdHandler, 
  getQuestionWithAnswer, 
  createQuestionHandler,
  getAllQuestionsHandler,
  updateQuestionHandler,
  deleteQuestionHandler,
  gradeAnswer
} from "../controllers/questionController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Get Questions by Grade and Subject (Public - for practice)
router.get("/grade/:gradeLevelId", getQuestionsByGrade);

// Get Questions for User's Subjects (Authenticated)
router.get("/my", authMiddleware, getMyQuestions);

// Get Question by ID (Public - without answer)
router.get("/:id", getQuestionByIdHandler);

// Get Question by ID with Answer (Authenticated - for checking answers)
router.get("/:id/answer", authMiddleware, getQuestionWithAnswer);

// Create Question (Admin only)
router.post("/", authMiddleware, adminMiddleware, createQuestionHandler);

// Get All Questions (Admin only)
router.get("/", authMiddleware, adminMiddleware, getAllQuestionsHandler);

// Update Question (Admin only)
router.put("/:id", authMiddleware, adminMiddleware, updateQuestionHandler);

// Delete Question (Admin only)
router.delete("/:id", authMiddleware, adminMiddleware, deleteQuestionHandler);

// Grade a student's answer (POST /api/questions/:questionId/grade)
router.post("/:questionId/grade", authMiddleware, gradeAnswer);

export default router;
