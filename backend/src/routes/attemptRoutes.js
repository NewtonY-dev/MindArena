import express from "express";
import { submitAnswer } from "../controllers/attemptController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, submitAnswer);

export default router;