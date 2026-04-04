import express from "express";
import { 
  getQuestionsByGradeAndSubject, 
  getQuestionsByUserSubjects, 
  getQuestionById, 
  createQuestion,
  getAllQuestions,
  updateQuestion,
  deleteQuestion
} from "../models/question.model.js";
import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";
import { gradeAndRecordAnswer } from "../services/gradingService.js";

const router = express.Router();

// Get Questions by Grade and Subject (Public - for practice)
router.get("/grade/:gradeLevelId", async (req, res) => {
  try {
    const { gradeLevelId } = req.params;
    const { subjectId } = req.query;
    
    const questions = await getQuestionsByGradeAndSubject(gradeLevelId, subjectId);
    
    // Remove correct_answer from public questions
    const publicQuestions = questions.map(q => ({
      id: q.id,
      content: q.content,
      difficultyLevel: q.difficulty_level,
      hint: q.hint,
      gradeLevelName: q.grade_level_name,
      subjectName: q.subject_name
    }));
    
    res.json({ questions: publicQuestions });
  } catch (error) {
    console.error("Error getting questions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Questions for User's Subjects (Authenticated)
router.get("/my", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const questions = await getQuestionsByUserSubjects(userId);
    
    // Remove correct_answer from practice questions
    const practiceQuestions = questions.map(q => ({
      id: q.id,
      content: q.content,
      difficultyLevel: q.difficulty_level,
      hint: q.hint,
      gradeLevelName: q.grade_level_name,
      subjectName: q.subject_name
    }));
    
    res.json({ questions: practiceQuestions });
  } catch (error) {
    console.error("Error getting user questions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Question by ID (Public - without answer)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const question = await getQuestionById(id);
    
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    
    // Remove correct_answer from public view
    const publicQuestion = {
      id: question.id,
      content: question.content,
      difficultyLevel: question.difficulty_level,
      hint: question.hint,
      explanation: question.explanation,
      gradeLevelName: question.grade_level_name,
      subjectName: question.subject_name,
      createdAt: question.created_at
    };
    
    res.json({ question: publicQuestion });
  } catch (error) {
    console.error("Error getting question:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get Question by ID with Answer (Authenticated - for checking answers)
router.get("/:id/answer", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const question = await getQuestionById(id);
    
    if (!question) {
      return res.status(404).json({ error: "Question not found" });
    }
    
    res.json({ question });
  } catch (error) {
    console.error("Error getting question with answer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create Question (Admin only)
router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { 
      gradeLevelId, 
      subjectId, 
      content, 
      correctAnswer, 
      hint, 
      explanation, 
      difficultyLevel = 'medium' 
    } = req.body;
    
    if (!gradeLevelId || !subjectId || !content || !correctAnswer) {
      return res.status(400).json({ 
        error: "gradeLevelId, subjectId, content, and correctAnswer are required" 
      });
    }
    
    const questionData = {
      gradeLevelId,
      subjectId,
      content,
      correctAnswer,
      hint,
      explanation,
      difficultyLevel
    };
    
    const questionId = await createQuestion(questionData);
    res.status(201).json({ 
      message: "Question created successfully",
      questionId 
    });
  } catch (error) {
    console.error("Error creating question:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get All Questions (Admin only)
router.get("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const questions = await getAllQuestions();
    res.json({ questions });
  } catch (error) {
    console.error("Error getting all questions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update Question (Admin only)
router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { content, correctAnswer, hint, explanation, difficultyLevel } = req.body;
    
    if (!content || !correctAnswer) {
      return res.status(400).json({ 
        error: "content and correctAnswer are required" 
      });
    }
    
    const questionData = {
      content,
      correctAnswer,
      hint,
      explanation,
      difficultyLevel: difficultyLevel || 'medium'
    };
    
    const updated = await updateQuestion(id, questionData);
    
    if (!updated) {
      return res.status(404).json({ error: "Question not found" });
    }
    
    res.json({ message: "Question updated successfully" });
  } catch (error) {
    console.error("Error updating question:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete Question (Admin only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const deleted = await deleteQuestion(id);
    
    if (!deleted) {
      return res.status(404).json({ error: "Question not found" });
    }
    
    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Grade a student's answer (POST /api/questions/:questionId/grade)
router.post("/:questionId/grade", authMiddleware, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { questionId } = req.params;
    const { answer } = req.body;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!answer || answer.trim().length === 0) {
      return res.status(400).json({ error: "Answer is required" });
    }

    const result = await gradeAndRecordAnswer({
      userId,
      questionId: parseInt(questionId, 10),
      userAnswer: answer
    });

    res.json(result);
  } catch (error) {
    console.error("Error grading answer:", error);
    if (error.message === 'Question not found') {
      return res.status(404).json({ error: "Question not found" });
    }
    if (error.message === 'Answer cannot be empty') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
