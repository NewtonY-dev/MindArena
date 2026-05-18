import express from "express";
import { 
  getAllGradeLevelsHandler, 
  getGradeLevelByIdHandler, 
  createGradeLevelHandler,
  getGradeLevelSubjectsHandler
} from "../controllers/gradeLevelController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Get All Grade Levels (Public)
router.get("/", getAllGradeLevelsHandler);

// Get Grade Level Subjects (Public)
router.get("/:id/subjects", getGradeLevelSubjectsHandler);

// Get Grade Level by ID (Public)
router.get("/:id", getGradeLevelByIdHandler);

// Create Grade Level (Admin only - would need admin middleware)
router.post("/", authMiddleware, createGradeLevelHandler);

export default router;
