import express from "express";
import {
  getAllSubjectsHandler,
  getSubjectByIdHandler,
  getSubjectsByGradeHandler,
  createSubjectHandler
} from "../controllers/subjectController.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// Get All Subjects (Public)
router.get("/", getAllSubjectsHandler);

// Get Subject by ID (Public)
router.get("/:id", getSubjectByIdHandler);

// Get Subjects by Grade Level (Public)
router.get("/grade/:gradeLevelId", getSubjectsByGradeHandler);

// Create Subject (Admin only)
router.post("/", authMiddleware, adminMiddleware, createSubjectHandler);

export default router;
