import { gradeWithGemini, gradeWithAIGeneratedExpected, generateExplanation } from './aiService.js';
import { createAttempt } from '../models/attempt.model.js';
import { getQuestionById } from '../models/question.model.js';
import db from '../config/db.js';

const CONFIDENCE_THRESHOLD = 0.7;

// Feature flag: Use AI-generated expected answers (set to false to use traditional stored answer comparison)
const USE_AI_GENERATED_EXPECTED = process.env.USE_AI_GENERATED_EXPECTED === 'true' || false;

/**
 * Drop problematic triggers that cause MySQL error 1442
 * Uses a direct connection with query (text protocol) to avoid prepared statements
 */
async function dropProblematicTriggers() {
  let connection = null;
  try {
    // Get a direct connection from the pool
    connection = await new Promise((resolve, reject) => {
      db.getConnection((err, conn) => {
        if (err) reject(err);
        else resolve(conn);
      });
    });

    // Use connection.query() (text protocol) instead of execute() (prepared statements)
    await new Promise((resolve, reject) => {
      connection.query('DROP TRIGGER IF EXISTS log_attempt_creation', (err) => {
        if (err && err.code !== 'ER_SP_DOES_NOT_EXIST') {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    await new Promise((resolve, reject) => {
      connection.query('DROP TRIGGER IF EXISTS log_contest_registration', (err) => {
        if (err && err.code !== 'ER_SP_DOES_NOT_EXIST') {
          reject(err);
        } else {
          resolve();
        }
      });
    });

    console.log('✓ Dropped problematic triggers');
  } catch (err) {
    console.log('Note: Could not drop triggers:', err.message);
  } finally {
    // Always release the connection back to the pool
    if (connection) {
      connection.release();
    }
  }
}

/**
 * Normalize text for comparison (includes stemming)
 * @param {string} text
 * @returns {string}
 */
function normalize(text) {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Stem a word to its root form for better matching
 * @param {string} word
 * @returns {string}
 */
function stemWord(word) {
  // Simple stemming rules for common cases
  return word
    .replace(/ies$/, 'y')   // babies -> baby
    .replace(/(s|es)$/, '') // cats -> cat, boxes -> box
    .replace(/ing$/, '')    // running -> run
    .replace(/ed$/, '')     // walked -> walk
    .replace(/(ied)$/, 'y'); // carried -> carry
}

/**
 * Calculate similarity between two strings (0-1)
 * @param {string} str1
 * @param {string} str2
 * @returns {number}
 */
function calculateSimilarity(str1, str2) {
  const s1 = normalize(str1);
  const s2 = normalize(str2);
  
  // If they're very close in length and content
  const lenDiff = Math.abs(s1.length - s2.length);
  const maxLen = Math.max(s1.length, s2.length);
  
  if (lenDiff / maxLen > 0.3) return 0; // Too different in length
  
  // Count matching words (with stemming)
  const words1 = s1.split(/\s+/).map(stemWord);
  const words2 = s2.split(/\s+/).map(stemWord);
  
  let matches = 0;
  const used = new Set();
  
  for (const w1 of words1) {
    for (let i = 0; i < words2.length; i++) {
      if (!used.has(i) && (w1 === words2[i] || w1.includes(words2[i]) || words2[i].includes(w1))) {
        matches++;
        used.add(i);
        break;
      }
    }
  }
  
  return matches / Math.max(words1.length, words2.length);
}

/**
 * Check for exact match (case-insensitive, allows minor differences)
 * @param {string} userAnswer
 * @param {string} correctAnswer
 * @returns {boolean}
 */
function isExactMatch(userAnswer, correctAnswer) {
  const similarity = calculateSimilarity(userAnswer, correctAnswer);
  return similarity >= 0.9; // 90% similarity threshold
}

/**
 * Check for keyword matches in the answer
 * @param {string} userAnswer
 * @param {string} correctAnswer
 * @returns {Object} - { matched: boolean, confidence: number }
 */
function checkKeywordMatch(userAnswer, correctAnswer) {
  const normalizedUser = normalize(userAnswer);
  const normalizedCorrect = normalize(correctAnswer);

  // Extract keywords (words with 3+ characters)
  const stopWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'its', 'may', 'new', 'now', 'old', 'see', 'two', 'who', 'boy', 'did', 'she', 'use', 'her', 'way', 'many', 'oil', 'sit', 'set', 'run', 'eat', 'far', 'sea', 'land', 'line', 'kind', 'next', 'word', 'been', 'call', 'came', 'each', 'find', 'first', 'good', 'made', 'most', 'over', 'said', 'some', 'time', 'very', 'what', 'with', 'after', 'back', 'come', 'could', 'does', 'down', 'from', 'give', 'have', 'here', 'just', 'know', 'last', 'left', 'like', 'live', 'look', 'make', 'move', 'much', 'must', 'name', 'need', 'only', 'open', 'part', 'place', 'put', 'right', 'same', 'seem', 'show', 'side', 'take', 'than', 'that', 'them', 'then', 'there', 'these', 'they', 'think', 'this', 'turn', 'under', 'want', 'water', 'well', 'went', 'were', 'when', 'where', 'which', 'while', 'white', 'will', 'work', 'would', 'year', 'your', 'audience', 'character', 'know', 'knows', 'more']);
  
  const keywords = normalizedCorrect
    .split(/\s+/)
    .filter(word => word.length >= 3)
    .map(stemWord)
    .filter(word => !stopWords.has(word));

  if (keywords.length === 0) {
    return { matched: false, confidence: 0 };
  }

  // Check for keyword matches with stemming
  const userWords = normalizedUser.split(/\s+/).map(stemWord);
  const matchedKeywords = keywords.filter(keyword => 
    userWords.some(userWord => 
      userWord === keyword || 
      userWord.includes(keyword) || 
      keyword.includes(userWord) ||
      calculateSimilarity(userWord, keyword) > 0.8
    )
  );
  
  const matchRatio = matchedKeywords.length / keywords.length;

  // High match ratio indicates likely correct answer
  if (matchRatio >= 0.7) {
    return { matched: true, confidence: Math.min(0.9, 0.7 + matchRatio * 0.2) };
  }

  // Partial match - unclear, needs AI
  if (matchRatio >= 0.4) {
    return { matched: false, confidence: matchRatio, needsAI: true };
  }

  return { matched: false, confidence: matchRatio };
}

/**
 * Grade a short answer using the full pipeline
 * 1. Normalize input
 * 2. Exact match check
 * 3. Keyword match check
 * 4. AI grading (if unclear)
 * 5. Apply confidence threshold
 * 6. Store attempt
 * 7. Return result
 *
 * @param {Object} params
 * @param {number} params.userId
 * @param {number} params.questionId
 * @param {string} params.userAnswer
 * @param {Object} params.question - Question object with content, correct_answer, explanation
 * @returns {Promise<Object>} - Grading result
 */
export async function gradeShortAnswer({ userId, questionId, userAnswer, question }) {
  if (!userAnswer || userAnswer.trim().length === 0) {
    throw new Error('Answer cannot be empty');
  }

  const normalizedAnswer = normalize(userAnswer);
  const correctAnswer = question.correct_answer;
  const questionText = question.content;

  let result = {
    isCorrect: false,
    confidence: 0,
    reason: '',
    scoreAwarded: 0,
    method: '',
    percentageScore: 0,
    analysis: '',
    missingConcepts: []
  };

  // Step 1: Exact match check
  if (isExactMatch(userAnswer, correctAnswer)) {
    result = {
      isCorrect: true,
      confidence: 1.0,
      reason: 'Exact match with correct answer',
      scoreAwarded: 1,
      method: 'exact_match',
      percentageScore: 100,
      analysis: 'Your answer matches the correct answer exactly.',
      missingConcepts: []
    };
  } else {
    // Step 2: Keyword match check
    const keywordResult = checkKeywordMatch(userAnswer, correctAnswer);

    if (keywordResult.matched) {
      const percentage = Math.round(keywordResult.confidence * 100);
      result = {
        isCorrect: true,
        confidence: keywordResult.confidence,
        reason: 'Key concepts from correct answer are present',
        scoreAwarded: Math.round((percentage / 100) * 10) / 10,
        method: 'keyword_match',
        percentageScore: percentage,
        analysis: `Your answer contains ${percentage}% of the key concepts.`,
        missingConcepts: []
      };
    } else if (!keywordResult.needsAI && keywordResult.confidence < 0.4) {
      // Low keyword match - likely incorrect
      const percentage = Math.round(keywordResult.confidence * 50); // Scale to 0-50%
      result = {
        isCorrect: false,
        confidence: 1 - keywordResult.confidence,
        reason: 'Answer does not contain key concepts from correct answer',
        scoreAwarded: 0,
        method: 'keyword_mismatch',
        percentageScore: percentage,
        analysis: `Your answer only contains ${percentage}% of the expected content.`,
        missingConcepts: []
      };
    } else {
      // Step 3: Unclear - use AI grading
      let aiResult;
      
      if (USE_AI_GENERATED_EXPECTED) {
        // New flow: AI generates expected answer from question, then evaluates
        console.log('Using AI-generated expected answer flow...');
        aiResult = await gradeWithAIGeneratedExpected({
          questionId,
          question: questionText,
          storedAnswer: correctAnswer,
          studentAnswer: userAnswer
        });
      } else {
        // Traditional flow: Compare with stored correct answer
        aiResult = await gradeWithGemini({
          question: questionText,
          correctAnswer: correctAnswer,
          rubric: question.explanation || '',
          userAnswer: userAnswer
        });
      }

      // Step 4: Apply confidence threshold
      if (aiResult.confidence >= CONFIDENCE_THRESHOLD) {
        result = {
          isCorrect: aiResult.isCorrect,
          confidence: aiResult.confidence,
          reason: aiResult.reason,
          scoreAwarded: aiResult.scoreAwarded,
          method: USE_AI_GENERATED_EXPECTED ? 'ai_generated_expected' : 'ai_grading',
          percentageScore: aiResult.percentageScore,
          analysis: aiResult.analysis,
          missingConcepts: aiResult.missingConcepts,
          generatedExpectedAnswer: aiResult.generatedExpectedAnswer // Only present in new flow
        };
      } else {
        // Low confidence AI result - mark as incorrect
        result = {
          isCorrect: false,
          confidence: aiResult.confidence,
          reason: 'AI confidence too low to verify answer correctness',
          scoreAwarded: 0,
          method: USE_AI_GENERATED_EXPECTED ? 'ai_generated_low_confidence' : 'ai_low_confidence',
          percentageScore: aiResult.percentageScore || 0,
          analysis: aiResult.analysis || 'Unable to analyze answer with confidence.',
          missingConcepts: aiResult.missingConcepts || [],
          generatedExpectedAnswer: aiResult.generatedExpectedAnswer
        };
      }
    }
  }

  // Step 5: Store attempt
  try {
    // Drop problematic triggers first (workaround for MySQL error 1442)
    await dropProblematicTriggers();
    
    await createAttempt({
      userId,
      questionId,
      answerGiven: userAnswer,
      isCorrect: result.isCorrect
    });
  } catch (error) {
    console.error('Failed to store attempt:', error);
    // Don't throw - we still want to return the grading result
  }

  return result;
}

/**
 * Grade an answer and update user points
 * @param {Object} params
 * @param {number} params.userId
 * @param {number} params.questionId
 * @param {string} params.userAnswer
 * @returns {Promise<Object>}
 */
export async function gradeAndRecordAnswer({ userId, questionId, userAnswer }) {
  // Get question details
  const question = await getQuestionById(questionId);

  if (!question) {
    throw new Error('Question not found');
  }

  // Grade the answer
  const gradingResult = await gradeShortAnswer({
    userId,
    questionId,
    userAnswer,
    question
  });

  // Generate beginner-friendly explanation for incorrect answers
  let aiExplanation = null;
  if (!gradingResult.isCorrect) {
    try {
      aiExplanation = await generateExplanation({
        question: question.content,
        correctAnswer: question.correct_answer,
        studentAnswer: userAnswer
      });
    } catch (error) {
      console.error('Failed to generate explanation:', error);
      aiExplanation = question.explanation || 'Review the correct answer above and try to understand the key concept.';
    }
  }

  return {
    ...gradingResult,
    correctAnswer: question.correct_answer,
    hint: question.hint,
    explanation: aiExplanation || question.explanation // Use AI explanation for incorrect, DB explanation for correct
  };
}

export default {
  gradeShortAnswer,
  gradeAndRecordAnswer,
  isExactMatch,
  checkKeywordMatch
};
