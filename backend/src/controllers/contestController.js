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
    
    console.log('[getContests] Starting with params:', { status, gradeLevelId, subjectId, userGradeLevelId });
    
    await updateContestStatuses();
    
    let contests;
    
    if (status) {
      console.log('[getContests] Fetching contests by status:', status);
      contests = await getContestsByStatus(
        status, 
        gradeLevelId ? parseInt(gradeLevelId) : userGradeLevelId, 
        50
      );
    } else {
      console.log('[getContests] Fetching all contests');
      contests = await getAllContests({
        gradeLevelId: gradeLevelId ? parseInt(gradeLevelId) : userGradeLevelId,
        subjectId: subjectId ? parseInt(subjectId) : null,
        limit: 50
      });
    }
    
    console.log('[getContests] Raw contests from DB:', contests?.length || 0, 'contests');
    console.log('[getContests] First contest sample:', contests?.[0] ? JSON.stringify(contests[0], null, 2) : 'No contests');
    
    const groupedContests = {
      upcoming: contests.filter(c => c.status === 'upcoming'),
      active: contests.filter(c => c.status === 'active'),
      passed: contests.filter(c => c.status === 'passed')
    };

    console.log('[getContests] Grouped counts:', {
      upcoming: groupedContests.upcoming.length,
      active: groupedContests.active.length,
      passed: groupedContests.passed.length
    });

    res.json({
      success: true,
      contests: contests,
      grouped: groupedContests,
      total: contests.length
    });
  } catch (error) {
    console.error('[getContests] Error getting contests:', error);
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
    
    // Ensure timeTaken has a default value
    const actualTimeTaken = timeTaken !== undefined ? timeTaken : 0;
    
    console.log('[submitContestAnswer] Starting - contestId:', contestId, 'questionId:', questionId, 'timeTaken:', actualTimeTaken);
    
    // Get the correct answer from questions
    const getCorrectAnswerSql = `SELECT correct_answer FROM questions WHERE id = ?`;
    const answerResult = await new Promise((resolve, reject) => {
      db.query(getCorrectAnswerSql, [questionId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    if (answerResult.length === 0) {
      console.log('[submitContestAnswer] Question not found:', questionId);
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }
    
    const correctAnswer = answerResult[0].correct_answer;
    const isCorrect = answer.toLowerCase().trim() === correctAnswer.toLowerCase().trim();
    
    // Calculate points (10 base + speed bonus)
    const basePoints = 10;
    const timeBonus = isCorrect ? Math.max(0, Math.floor((30 - actualTimeTaken) / 3)) : 0;
    const pointsAwarded = isCorrect ? basePoints + timeBonus : 0;
    
    console.log('[submitContestAnswer] Answer correct:', isCorrect, 'Points:', pointsAwarded);
    
    // Record the attempt
    await createContestAttempt({
      contestId,
      userId,
      questionId,
      answerGiven: answer,
      isCorrect,
      pointsAwarded,
      timeTaken: actualTimeTaken
    });
    
    // Get participant and update score
    const participant = await getContestParticipant(contestId, userId);
    if (participant) {
      await updateContestParticipant(participant.id, {
        score: participant.score + pointsAwarded,
        correctAnswers: participant.correct_answers + (isCorrect ? 1 : 0),
        totalAnswered: participant.total_answered + 1,
        currentQuestionIndex: participant.current_question_index + 1,
        timeSpentSeconds: participant.time_spent_seconds + actualTimeTaken
      });
      console.log('[submitContestAnswer] Updated participant score');
    }
    
    res.json({
      success: true,
      isCorrect,
      pointsAwarded,
      totalPoints: participant ? participant.score + pointsAwarded : pointsAwarded,
      correctAnswer: isCorrect ? null : correctAnswer
    });
  } catch (error) {
    console.error('[submitContestAnswer] Error:', error);
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
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log('[registerForContest] Starting - contestId:', id, 'userId:', userId);
    
    await updateContestStatuses();
    
    const contest = await getContestFromDB(parseInt(id));
    
    if (!contest) {
      console.log('[registerForContest] Contest not found:', id);
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    console.log('[registerForContest] Contest found:', contest.title, 'status:', contest.status);

    if (contest.status !== 'upcoming' && contest.status !== 'active') {
      return res.status(400).json({
        success: false,
        error: 'Can only register for upcoming or active contests'
      });
    }
    
    // Check if already registered
    const existingParticipant = await getContestParticipant(parseInt(id), userId);
    
    if (existingParticipant) {
      console.log('[registerForContest] Already registered');
      return res.status(400).json({
        success: false,
        error: 'Already registered for this contest'
      });
    }
    
    // Create participant record (registration only)
    await createContestParticipant({
      contestId: parseInt(id),
      userId,
      score: 0,
      correctAnswers: 0,
      totalAnswered: 0,
      currentQuestionIndex: 0,
      timeSpentSeconds: 0
    });
    
    console.log('[registerForContest] Successfully registered');
    
    res.json({
      success: true,
      message: 'Successfully registered for contest',
      registered: true
    });
  } catch (error) {
    console.error('[registerForContest] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register for contest'
    });
  }
};

const unregisterFromContest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log('[unregisterFromContest] Starting - contestId:', id, 'userId:', userId);
    
    const sql = `DELETE FROM contest_participants WHERE contest_id = ? AND user_id = ? AND score = 0`;
    
    const result = await new Promise((resolve, reject) => {
      db.query(sql, [parseInt(id), userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    if (result.affectedRows === 0) {
      console.log('[unregisterFromContest] Cannot unregister - may have started or not registered');
      return res.status(400).json({
        success: false,
        error: 'Cannot unregister - contest may have already started or not registered'
      });
    }
    
    console.log('[unregisterFromContest] Successfully unregistered');
    
    res.json({
      success: true,
      message: 'Successfully unregistered from contest',
      registered: false
    });
  } catch (error) {
    console.error('[unregisterFromContest] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unregister from contest'
    });
  }
};

const getUserContestRegistrations = async (req, res) => {
  try {
    const userId = req.user.id;
    
    console.log('[getUserContestRegistrations] Starting for user:', userId);
    
    await updateContestStatuses();
    
    // Check what columns exist in contest_participants
    const checkColumnsSql = `DESCRIBE contest_participants`;
    const columns = await new Promise((resolve, reject) => {
      db.query(checkColumnsSql, (err, results) => {
        if (err) {
          console.log('[getUserContestRegistrations] Could not describe table:', err.message);
          resolve([]);
        } else {
          console.log('[getUserContestRegistrations] Table columns:', results.map(c => c.Field));
          resolve(results);
        }
      });
    });
    
    const columnNames = columns.map(c => c.Field);
    const hasCorrectAnswers = columnNames.includes('correct_answers');
    const hasTotalAnswered = columnNames.includes('total_answered');
    const hasFinishedAt = columnNames.includes('finished_at');
    
    console.log('[getUserContestRegistrations] Has correct_answers:', hasCorrectAnswers);
    console.log('[getUserContestRegistrations] Has total_answered:', hasTotalAnswered);
    console.log('[getUserContestRegistrations] Has finished_at:', hasFinishedAt);
    
    // Build query based on available columns
    let sql = `
      SELECT 
        c.*,
        gl.name as grade_level_name,
        s.name as subject_name,
        cp.score as user_score
        ${hasCorrectAnswers ? ', cp.correct_answers as user_correct' : ''}
        ${hasTotalAnswered ? ', cp.total_answered as user_answered' : ''}
        ${hasFinishedAt ? ', cp.finished_at as user_finished_at' : ''}
      FROM contest_participants cp
      INNER JOIN contests c ON cp.contest_id = c.id
      LEFT JOIN grade_levels gl ON c.grade_level_id = gl.id
      LEFT JOIN subjects s ON c.subject_id = s.id
      WHERE cp.user_id = ?
      ORDER BY c.start_time DESC
    `;
    
    console.log('[getUserContestRegistrations] Executing query for user:', userId);
    
    const registrations = await new Promise((resolve, reject) => {
      db.query(sql, [userId], (err, results) => {
        if (err) {
          console.error('[getUserContestRegistrations] Query error:', err);
          reject(err);
        } else {
          console.log('[getUserContestRegistrations] Found', results?.length || 0, 'registrations');
          resolve(results);
        }
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
        userCorrect: r.user_correct || 0,
        userAnswered: r.user_answered || 0,
        finishedAt: r.user_finished_at || null
      }))
    });
  } catch (error) {
    console.error('[getUserContestRegistrations] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get contest registrations'
    });
  }
};

const finishContest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    console.log('[finishContest] Marking contest as finished - contestId:', id, 'userId:', userId);
    
    // Update participant record with finished_at timestamp
    const sql = `UPDATE contest_participants SET finished_at = NOW() WHERE contest_id = ? AND user_id = ?`;
    
    await new Promise((resolve, reject) => {
      db.query(sql, [parseInt(id), userId], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });
    
    console.log('[finishContest] Contest marked as finished');
    
    res.json({
      success: true,
      message: 'Contest completed successfully'
    });
  } catch (error) {
    console.error('[finishContest] Error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to finish contest'
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
  getUserContestRegistrations,
  finishContest
};
