import express from "express";
import { getCurrentUser, setupUserProfile, getDashboardStats } from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Get Current User Profile
router.get("/me", authMiddleware, getCurrentUser);

// Update Current User Profile (alternative endpoint)
router.post("/me", authMiddleware, setupUserProfile);

// Setup User Profile (Grade & Subjects)
router.patch("/me/profile", authMiddleware, setupUserProfile);

// Get Dashboard Stats (Points & Accuracy)
router.get("/me/stats", authMiddleware, getDashboardStats);

export default router;