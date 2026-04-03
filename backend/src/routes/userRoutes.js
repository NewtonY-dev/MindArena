import express from "express";
import { getCurrentUser, setupUserProfile, getDashboardStats } from "../controllers/userController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/me", authMiddleware, getCurrentUser);
router.patch("/me/profile", authMiddleware, setupUserProfile);
router.get("/me/stats", authMiddleware, getDashboardStats);

export default router;