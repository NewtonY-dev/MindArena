import express from "express";
import { 
  getQuestionsByGradeAndSubject, 
  getQuestionsByUserSubjects, 
  getQuestionById, 
  createQuestion 
} from "../models/question.model.js";
import authMiddleware from "../middleware/authMiddleware.js";

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

// Create Question (Admin only - would need admin middleware)
router.post("/", authMiddleware, async (req, res) => {
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

export default router;
