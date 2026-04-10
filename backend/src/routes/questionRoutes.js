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

// Get Questions by Grade and Subject (Authenticated)
router.get("/grade/:gradeLevelId", authMiddleware, getQuestionsByGrade);

// Get Questions for User's Subjects (Authenticated)
router.get("/my", authMiddleware, getMyQuestions);

// Get Question by ID (Authenticated - without answer)
router.get("/:id", authMiddleware, getQuestionByIdHandler);

// Get Question by ID with Answer (Authenticated - for checking answers)
router.get("/:id/answer", authMiddleware, getQuestionWithAnswer);


// Admin Only

// Create Question 
router.post("/", authMiddleware, adminMiddleware, createQuestionHandler);

// Get All Questions 
router.get("/", authMiddleware, adminMiddleware, getAllQuestionsHandler);

// Update Question 
router.put("/:id", authMiddleware, adminMiddleware, updateQuestionHandler);

// Delete Question 
router.delete("/:id", authMiddleware, adminMiddleware, deleteQuestionHandler);

// Grade a student's answer (POST /api/questions/:questionId/grade)
router.post("/:questionId/grade", authMiddleware, gradeAnswer);

export default router;
