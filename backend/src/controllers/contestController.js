import db from '../config/db.js';
import {
  getAllContests,
  getContestById as getContestFromDB,
  getContestsByStatus,
  refreshContestStatus,
  getContestQuestions,
  assignQuestionsToContest,
  createContestParticipant,
  getContestParticipant,
  updateContestParticipant,
  createContestAttempt
} from '../models/contest.model.js';

// Helper to update contest statuses based on current time
const updateContestStatuses = async () => {
  try {
    await refreshContestStatus();
  } catch (error) {
    console.error('Error refreshing contest statuses:', error);
  }
};

const getContests = async (req, res) => {
  try {
    const { status, gradeLevelId, subjectId } = req.query;
    const userGradeLevelId = req.user?.gradeLevelId;
    
    // Refresh statuses before returning contests
    await updateContestStatuses();
    
    let contests;
    
    if (status) {
      // Filter by status (upcoming, active, passed)
      contests = await getContestsByStatus(
        status, 
        gradeLevelId ? parseInt(gradeLevelId) : userGradeLevelId, 
        50
      );
    } else {
      // Get all contests with optional filters
      contests = await getAllContests({
        gradeLevelId: gradeLevelId ? parseInt(gradeLevelId) : userGradeLevelId,
        subjectId: subjectId ? parseInt(subjectId) : null,
        limit: 50
      });
    }
    
    // Group contests by status for easier frontend handling
    const groupedContests = {
      upcoming: contests.filter(c => c.status === 'upcoming'),
      active: contests.filter(c => c.status === 'active'),
      passed: contests.filter(c => c.status === 'passed')
    };

    res.json({
      success: true,
      contests: contests,
      grouped: groupedContests,
      total: contests.length
    });
  } catch (error) {
    console.error('Error getting contests:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contests'
    });
  }
};

const getContestById = async (req, res) => {
  try {
    const { id } = req.params;
    
    await updateContestStatuses();
    
    const contest = await getContestFromDB(parseInt(id));
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }
    
    // Get questions if contest is passed or user has participated
    let questions = [];
    if (contest.status === 'passed') {
      questions = await getContestQuestions(parseInt(id));
    }

    res.json({
      success: true,
      contest,
      questions: questions.length > 0 ? questions : undefined
    });
  } catch (error) {
    console.error('Error getting contest:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contest'
    });
  }
};

const startContest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    await updateContestStatuses();
    
    const contest = await getContestFromDB(parseInt(id));
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    if (contest.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: `Contest is ${contest.status}. Only active contests can be started.`
      });
    }
    
    // Check if user has already started this contest
    const participant = await getContestParticipant(parseInt(id), userId);
    
    if (participant && participant.score > 0) {
      // User already completed
      return res.status(400).json({
        success: false,
        error: 'You have already completed this contest'
      });
    }
    
    // Get questions for the contest
    const questions = await getContestQuestions(parseInt(id));
    
    if (!participant) {
      // Create participant record
      await createContestParticipant({
        contestId: parseInt(id),
        userId,
        score: 0,
        correctAnswers: 0,
        totalAnswered: 0,
        currentQuestionIndex: 0,
        timeSpentSeconds: 0
      });
    }

    res.json({
      success: true,
      message: 'Contest started successfully',
      contest: {
        id: contest.id,
        title: contest.title,
        description: contest.description,
        timePerQuestion: contest.time_per_question,
        questionCount: contest.question_count,
        currentQuestion: participant?.current_question_index || 0,
        totalQuestions: questions.length
      },
      questions: questions.map(q => ({
        id: q.id,
        content: q.content,
        hint: q.hint,
        difficulty: q.difficulty_level
      }))
    });
  } catch (error) {
    console.error('Error starting contest:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start contest'
    });
  }
};

const submitContestAnswer = async (req, res) => {
  try {
    const { contestId, questionId, answer, timeTaken } = req.body;
    const userId = req.user.id;
    
    // Get the correct answer from questions
    const getCorrectAnswerSql = `SELECT correct_answer FROM questions WHERE id = ?`;
    const answerResult = await new Promise((resolve, reject) => {
      db.query(getCorrectAnswerSql, [questionId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    if (answerResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }
    
    const correctAnswer = answerResult[0].correct_answer;
    const isCorrect = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    
    // Calculate points (10 base + speed bonus)
    const basePoints = 10;
    const timeBonus = isCorrect ? Math.max(0, Math.floor((30 - timeTaken) / 3)) : 0;
    const pointsAwarded = isCorrect ? basePoints + timeBonus : 0;
    
    // Record the attempt
    await createContestAttempt({
      contestId,
      userId,
      questionId,
      answerGiven: answer,
      isCorrect,
      pointsAwarded,
      timeTaken
    });
    
    // Get participant and update score
    const participant = await getContestParticipant(contestId, userId);
    if (participant) {
      await updateContestParticipant(participant.id, {
        score: participant.score + pointsAwarded,
        correctAnswers: participant.correct_answers + (isCorrect ? 1 : 0),
        totalAnswered: participant.total_answered + 1,
        currentQuestionIndex: participant.current_question_index + 1,
        timeSpentSeconds: participant.time_spent_seconds + timeTaken
      });
    }
    
    res.json({
      success: true,
      isCorrect,
      pointsAwarded,
      totalPoints: participant ? participant.score + pointsAwarded : pointsAwarded
    });
  } catch (error) {
    console.error('Error submitting contest answer:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to submit answer'
    });
  }
};

const getContestLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sql = `
      SELECT 
        cp.user_id,
        u.display_name,
        cp.score,
        cp.correct_answers,
        cp.total_answered,
        CASE WHEN cp.total_answered > 0 
          THEN ROUND((cp.correct_answers / cp.total_answered) * 100, 1) 
          ELSE 0 
        END as accuracy
      FROM contest_participants cp
      INNER JOIN users u ON cp.user_id = u.id
      WHERE cp.contest_id = ?
      ORDER BY cp.score DESC, cp.correct_answers DESC
      LIMIT 50
    `;
    
    const leaderboard = await new Promise((resolve, reject) => {
      db.query(sql, [parseInt(id)], (err, results) => {
        if (err) reject(err);
        else resolve(results.map((row, index) => ({
          rank: index + 1,
          userId: row.user_id,
          displayName: row.display_name,
          score: row.score,
          accuracy: row.accuracy,
          correctAnswers: row.correct_answers,
          totalAnswered: row.total_answered
        })));
      });
    });
    
    res.json({
      success: true,
      leaderboard,
      totalParticipants: leaderboard.length
    });
  } catch (error) {
    console.error('Error getting contest leaderboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contest leaderboard'
    });
  }
};

const registerForContest = async (req, res) => {
  try {
    const { contestId } = req.params;
    const userId = req.user.id;
    
    await updateContestStatuses();
    
    const contest = await getContestFromDB(parseInt(contestId));
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    if (contest.status !== 'upcoming' && contest.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Can only register for upcoming or active contests'
      });
    }
    
    // Check if already registered
    const existingParticipant = await getContestParticipant(parseInt(contestId), userId);
    
    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        error: 'Already registered for this contest'
      });
    }
    
    // Create participant record (registration only)
    await createContestParticipant({
      contestId: parseInt(contestId),
      userId,
      score: 0,
      correctAnswers: 0,
      totalAnswered: 0,
      currentQuestionIndex: 0,
      timeSpentSeconds: 0
    });
    
    res.json({
      success: true,
      message: 'Successfully registered for contest',
      registered: true
    });
  } catch (error) {
    console.error('Error registering for contest:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register for contest'
    });
  }
};

const unregisterFromContest = async (req, res) => {
  try {
    const { contestId } = req.params;
    const userId = req.user.id;
    
    const sql = `DELETE FROM contest_participants WHERE contest_id = ? AND user_id = ? AND score = 0`;
    
    const result = await new Promise((resolve, reject) => {
      db.query(sql, [parseInt(contestId), userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    if (result.affectedRows === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot unregister - contest may have already started or not registered'
      });
    }
    
    res.json({
      success: true,
      message: 'Successfully unregistered from contest',
      registered: false
    });
  } catch (error) {
    console.error('Error unregistering from contest:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unregister from contest'
    });
  }
};

const getUserContestRegistrations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    await updateContestStatuses();
    
    const sql = `
      SELECT 
        c.*,
        gl.name as grade_level_name,
        s.name as subject_name,
        cp.score as user_score,
        cp.correct_answers as user_correct,
        cp.total_answered as user_answered
      FROM contest_participants cp
      INNER JOIN contests c ON cp.contest_id = c.id
      LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
      LEFT JOIN subjects s ON c.subject_id = s.id
      WHERE cp.user_id = ?
      ORDER BY c.start_time DESC
    `;
    
    const registrations = await new Promise((resolve, reject) => {
      db.query(sql, [userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    res.json({
      success: true,
      registrations: registrations.map(r => ({
        contestId: r.id,
        title: r.title,
        status: r.status,
        startTime: r.start_time,
        endTime: r.end_time,
        userScore: r.user_score,
        userCorrect: r.user_correct,
        userAnswered: r.user_answered
      }))
    });
  } catch (error) {
    console.error('Error getting contest registrations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contest registrations'
    });
  }
};

export {
  getContests,
  getContestById,
  startContest,
  submitContestAnswer,
  getContestLeaderboard,
  registerForContest,
  unregisterFromContest,
  getUserContestRegistrations
};
