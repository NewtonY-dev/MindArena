import { getCorrectlyAnsweredQuestions as getCorrectlyAnsweredAttempts, submitPracticeAttempt } from "../models/attempt.model.js";
import { getAvailablePracticeQuestions, getFallbackPracticeQuestions, getPracticeProgressCounts } from "../models/question.model.js";
import { getUserById } from "../models/user.model.js";
import { getUserSubjectIds } from "../models/userSubject.model.js";

export const getQuestions = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { subjectId } = req.query;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const gradeLevelId = user.grade_level_id;
    if (!gradeLevelId) {
      return res.status(400).json({
        error: "Grade level not set. Please complete your profile setup.",
        code: "PROFILE_INCOMPLETE"
      });
    }

    let questions = await getAvailablePracticeQuestions(userId, gradeLevelId, subjectId || null);
    if (questions.length === 0) {
      questions = await getFallbackPracticeQuestions(userId, gradeLevelId);
    }

    if (questions.length === 0) {
      return res.status(404).json({ error: "No questions found" });
    }

    res.json({
      questions: questions.map((q) => ({
        id: q.id,
        content: q.content,
        difficultyLevel: q.difficulty_level,
        hint: q.hint
      }))
    });
  } catch (error) {
    console.error("Error in getQuestions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getCorrectlyAnsweredQuestions = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const results = await getCorrectlyAnsweredAttempts(userId, 50);
    const questions = results.map((r) => ({
      attemptId: r.attempt_id,
      questionId: r.question_id,
      content: r.content,
      userAnswer: r.answer_given,
      correctAnswer: r.correct_answer,
      difficultyLevel: r.difficulty_level,
      explanation: r.explanation,
      gradeLevelName: r.grade_level_name,
      subjectName: r.subject_name,
      answeredAt: r.created_at
    }));

    res.json({ questions, total: questions.length });
  } catch (error) {
    console.error("Error in getCorrectlyAnsweredQuestions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { questionId, answerGiven } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (!questionId || answerGiven === undefined) {
      return res.status(400).json({ error: "questionId and answerGiven are required" });
    }
    
    const result = await submitPracticeAttempt({ userId, questionId, answerGiven });
    if (!result) {
      return res.status(404).json({ error: "Question not found" });
    }

    res.json(result);
  } catch (error) {
    console.error("Error in submitAnswer:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getProgress = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { subjectId } = req.query;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const user = await getUserById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const gradeLevelId = user.grade_level_id;
    if (!gradeLevelId) {
      return res.status(400).json({
        error: "Grade level not set. Please complete your profile setup.",
        code: "PROFILE_INCOMPLETE"
      });
    }

    if (subjectId) {
      const subjectIds = await getUserSubjectIds(userId);
      if (!subjectIds.includes(parseInt(subjectId, 10))) {
        return res.status(403).json({
          error: "Subject not in your enrolled subjects"
        });
      }
    }

    const { totalQuestions, answeredCorrectly } = await getPracticeProgressCounts(
      userId,
      gradeLevelId,
      subjectId ? parseInt(subjectId, 10) : null
    );

    const percentage = totalQuestions > 0
      ? Math.round((answeredCorrectly / totalQuestions) * 1000) / 10
      : 0;

    const response = {
      progress: {
        subjectId: subjectId ? parseInt(subjectId, 10) : null,
        scope: subjectId ? "subject" : "overall",
        totalQuestions,
        answeredCorrectly,
        percentage,
        remaining: totalQuestions - answeredCorrectly
      }
    };

    if (totalQuestions === 0) {
      response.progress.message = "No questions available for this scope";
    }

    res.json(response);
  } catch (error) {
    console.error("Error in getProgress:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
