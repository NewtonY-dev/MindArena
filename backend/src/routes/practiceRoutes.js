import express from "express";
import { listPracticeQuestions } from "../controllers/practiceController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/questions", authMiddleware, listPracticeQuestions);

export default router;