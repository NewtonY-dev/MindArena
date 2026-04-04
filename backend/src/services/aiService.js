import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.warn('GEMINI_API_KEY not set. AI grading will fallback to false.');
} else {
  console.log('✅ Gemini API key configured');
}

const genAI = API_KEY ? new GoogleGenerativeAI(API_KEY) : null;

// Log connection status
if (genAI) {
  console.log('✅ Gemini AI service initialized');
} else {
  console.log('⚠️  Gemini AI service not available - grading will use keyword matching only');
}

// Cache for generated expected answers (questionId -> expectedAnswer)
const expectedAnswerCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

// Simple cache with TTL
function getCachedExpectedAnswer(questionId) {
  const cached = expectedAnswerCache.get(questionId);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.answer;
  }
  expectedAnswerCache.delete(questionId);
  return null;
}

function setCachedExpectedAnswer(questionId, answer) {
  expectedAnswerCache.set(questionId, {
    answer,
    timestamp: Date.now()
  });
}

// Prompt A: Generate expected answer from question
const PROMPT_A_GENERATE_EXPECTED = `You are an expert educator. Given a question, generate a concise, ideal answer (1-2 sentences) that a student should provide.

Requirements:
- Answer must directly address the question
- Include key concepts and terminology
- Be clear and educational
- Do NOT include explanations about the answer, just the answer itself

Return ONLY the expected answer as plain text (no JSON, no markdown).`;

// Prompt B: Evaluate student answer
const PROMPT_B_EVALUATE = `You are an AI grading assistant. Compare the student's answer with the expected answer.

Evaluation Rules:
1. Accept synonyms and semantic equivalents (different wording, same meaning)
2. Allow partial credit if the core meaning is correct
3. Focus on semantic correctness, NOT exact wording
4. Consider the question context when evaluating
5. Ignore minor grammar/spelling errors
6. Empty or irrelevant answers = score 0

Scoring Guide:
- Score 1.0: Fully correct, all key concepts present
- Score 0.7-0.9: Mostly correct, minor omissions
- Score 0.4-0.6: Partially correct, some concepts missing
- Score 0.1-0.3: Weak answer, mostly incorrect
- Score 0: Completely wrong or irrelevant

Return ONLY valid JSON in this exact format:
{
  "isCorrect": boolean,
  "score": number (0.0 to 1.0),
  "reason": string (brief explanation of the score)
}`;

// Prompt C: Generate beginner-friendly explanation for incorrect answers
const PROMPT_C_EXPLAIN = `You are a patient, encouraging tutor explaining why an answer is correct to a student who got it wrong.

Your explanation should:
1. Be simple and beginner-friendly (avoid jargon)
2. Explain the core concept clearly
3. Walk through the logical thinking step-by-step
4. Use relatable examples when helpful
5. Be encouraging and supportive in tone
6. Keep it concise (4-5 short paragraphs max)

Format your response as simple paragraphs. Do NOT use bullet points, numbers, or markdown formatting like **bold** or *italic*. Just clear, plain text paragraphs.

Structure:
- First: Explain what the correct answer means in simple terms
- Then: Walk through the reasoning/logic behind it
- Finally: Give a helpful tip or encouragement for next time`;

/**
 * Call Gemini API to grade a student's answer
 * @param {Object} params - Grading parameters
 * @param {string} params.question - The question text
 * @param {string} params.correctAnswer - The correct answer
 * @param {string} params.rubric - The grading rubric (optional)
 * @param {string} params.userAnswer - The student's answer
 * @returns {Promise<Object>} - Grading result
 */
export async function gradeWithGemini({ question, correctAnswer, rubric = '', userAnswer }) {
  if (!genAI) {
    return {
      isCorrect: false,
      confidence: 0,
      reason: 'AI grading not available - API key not configured',
      scoreAwarded: 0
    };
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 256
    }
  });

  const userPrompt = `Question:
${question}

Correct Answer:
${correctAnswer}

Rubric:
${rubric || 'Accept answers with the same meaning as the correct answer. Focus on key concepts.'}

Student Answer:
${userAnswer}`;

  try {
    const result = await model.generateContent({
      contents: [
        { role: 'user', parts: [{ text: SYSTEM_INSTRUCTION }] },
        { role: 'model', parts: [{ text: 'I understand. I will grade answers objectively and return only JSON.' }] },
        { role: 'user', parts: [{ text: userPrompt }] }
      ]
    });

    const response = result.response;
    const text = response.text();

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = text;
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ||
                      text.match(/```\n?([\s\S]*?)\n?```/) ||
                      text.match(/{[\s\S]*}/);

    if (jsonMatch) {
      jsonText = jsonMatch[1] || jsonMatch[0];
    }

    const parsed = JSON.parse(jsonText);

    // Validate response structure
    if (typeof parsed.percentageScore !== 'number' ||
        typeof parsed.isCorrect !== 'boolean' ||
        typeof parsed.confidence !== 'number' ||
        typeof parsed.reason !== 'string') {
      throw new Error('Invalid response structure from Gemini');
    }

    // Ensure percentage is within 0-100 range
    const percentage = Math.max(0, Math.min(100, Math.round(parsed.percentageScore)));
    
    return {
      percentageScore: percentage,
      isCorrect: parsed.isCorrect || percentage >= 70,
      confidence: parsed.confidence,
      reason: parsed.reason,
      analysis: parsed.analysis || '',
      missingConcepts: parsed.missingConcepts || [],
      scoreAwarded: Math.round((percentage / 100) * 10) / 10 // Convert to 0-1 scale with 1 decimal
    };
  } catch (error) {
    console.error('Gemini grading error:', error);
    return {
      percentageScore: 0,
      isCorrect: false,
      confidence: 0,
      reason: 'AI grading failed',
      analysis: '',
      missingConcepts: [],
      scoreAwarded: 0
    };
  }
}

export default { gradeWithGemini, gradeWithAIGeneratedExpected, generateExpectedAnswer, evaluateStudentAnswer };

/**
 * Step 1: Generate expected answer from question using AI
 * @param {string} question - The question text
 * @param {number} questionId - Optional question ID for caching
 * @returns {Promise<string>} - Generated expected answer
 */
export async function generateExpectedAnswer(question, questionId = null) {
  if (!genAI) {
    throw new Error('AI service not available');
  }

  // Check cache first
  if (questionId) {
    const cached = getCachedExpectedAnswer(questionId);
    if (cached) {
      console.log(`Using cached expected answer for question ${questionId}`);
      return cached;
    }
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.2, // Low temperature for consistency
      maxOutputTokens: 128
    }
  });

  const prompt = `${PROMPT_A_GENERATE_EXPECTED}

Question: ${question}

Expected Answer:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let expectedAnswer = response.text().trim();

    // Clean up the response
    expectedAnswer = expectedAnswer
      .replace(/^(expected answer:|answer:|the answer is:)/i, '')
      .trim();

    // Validate - must not be empty
    if (!expectedAnswer || expectedAnswer.length < 5) {
      throw new Error('Generated expected answer is too short or empty');
    }

    // Cache the result
    if (questionId) {
      setCachedExpectedAnswer(questionId, expectedAnswer);
    }

    return expectedAnswer;
  } catch (error) {
    console.error('Error generating expected answer:', error);
    throw error;
  }
}

/**
 * Step 2: Evaluate student answer against expected answer
 * @param {Object} params
 * @param {string} params.question - The question text
 * @param {string} params.expectedAnswer - The AI-generated expected answer
 * @param {string} params.studentAnswer - The student's answer
 * @returns {Promise<Object>} - Evaluation result { isCorrect, score, reason }
 */
export async function evaluateStudentAnswer({ question, expectedAnswer, studentAnswer }) {
  if (!genAI) {
    return {
      isCorrect: false,
      score: 0,
      reason: 'AI grading not available - API key not configured'
    };
  }

  // Edge case: empty or very short answers
  if (!studentAnswer || studentAnswer.trim().length === 0) {
    return {
      isCorrect: false,
      score: 0,
      reason: 'No answer provided'
    };
  }

  if (studentAnswer.trim().length < 2) {
    return {
      isCorrect: false,
      score: 0,
      reason: 'Answer is too short to evaluate'
    };
  }

  // Edge case: irrelevant/random text detection
  const irrelevantPatterns = [/^[a-z]$/, /^(abc|xyz|test|asdf|qwerty)$/i, /^[0-9]+$/];
  if (irrelevantPatterns.some(pattern => pattern.test(studentAnswer.trim()))) {
    return {
      isCorrect: false,
      score: 0,
      reason: 'Answer appears to be random or irrelevant text'
    };
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.1, // Very low for consistent evaluation
      maxOutputTokens: 256
    }
  });

  const prompt = `${PROMPT_B_EVALUATE}

Question: ${question}

Expected Answer: ${expectedAnswer}

Student Answer: ${studentAnswer}

Evaluation:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Extract JSON
    let jsonText = text;
    const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ||
                      text.match(/```\n?([\s\S]*?)\n?```/) ||
                      text.match(/{[\s\S]*}/);

    if (jsonMatch) {
      jsonText = jsonMatch[1] || jsonMatch[0];
    }

    const parsed = JSON.parse(jsonText);

    // Validate response
    if (typeof parsed.isCorrect !== 'boolean' ||
        typeof parsed.score !== 'number' ||
        typeof parsed.reason !== 'string') {
      throw new Error('Invalid response structure from Gemini');
    }

    // Normalize score to 0-1 range
    const normalizedScore = Math.max(0, Math.min(1, parsed.score));

    // Determine correctness threshold (>= 0.7 is correct)
    const isCorrect = parsed.isCorrect || normalizedScore >= 0.7;

    return {
      isCorrect,
      score: normalizedScore,
      reason: parsed.reason
    };
  } catch (error) {
    console.error('Error evaluating student answer:', error);
    
    // Fallback: basic similarity check
    const similarity = calculateBasicSimilarity(studentAnswer, expectedAnswer);
    return {
      isCorrect: similarity >= 0.7,
      score: similarity,
      reason: `AI evaluation failed. Basic similarity score: ${Math.round(similarity * 100)}%`
    };
  }
}

/**
 * Basic similarity calculation for fallback
 * @param {string} str1 
 * @param {string} str2 
 * @returns {number} - Similarity score 0-1
 */
function calculateBasicSimilarity(str1, str2) {
  const normalize = (s) => s.toLowerCase().trim().replace(/[^a-z0-9\s]/g, '');
  const s1 = normalize(str1);
  const s2 = normalize(str2);
  
  if (s1 === s2) return 1;
  
  const words1 = new Set(s1.split(/\s+/));
  const words2 = new Set(s2.split(/\s+/));
  
  const intersection = [...words1].filter(w => words2.has(w));
  const union = new Set([...words1, ...words2]);
  
  return intersection.length / union.size;
}

/**
 * Complete AI grading flow: Generate expected answer + Evaluate student answer
 * @param {Object} params
 * @param {number} params.questionId - Question ID
 * @param {string} params.question - The question text
 * @param {string} params.storedAnswer - The stored correct answer (fallback)
 * @param {string} params.studentAnswer - The student's answer
 * @returns {Promise<Object>} - Complete grading result
 */
export async function gradeWithAIGeneratedExpected({ questionId, question, storedAnswer, studentAnswer }) {
  if (!genAI) {
    // Fallback to stored answer comparison
    return fallbackGrading(storedAnswer, studentAnswer);
  }

  try {
    // Step 1: Generate expected answer from question
    console.log(`Generating expected answer for question ${questionId}...`);
    const expectedAnswer = await generateExpectedAnswer(question, questionId);
    console.log(`Generated expected answer: "${expectedAnswer}"`);

    // Step 2: Evaluate student answer against generated expected answer
    const evaluation = await evaluateStudentAnswer({
      question,
      expectedAnswer,
      studentAnswer
    });

    return {
      isCorrect: evaluation.isCorrect,
      confidence: evaluation.score,
      reason: evaluation.reason,
      scoreAwarded: Math.round(evaluation.score * 10) / 10,
      percentageScore: Math.round(evaluation.score * 100),
      analysis: `AI-generated expected answer: "${expectedAnswer}"`,
      missingConcepts: [],
      method: 'ai_generated_expected',
      generatedExpectedAnswer: expectedAnswer // For debugging
    };
  } catch (error) {
    console.error('AI-generated expected answer grading failed:', error);
    
    // Fallback to stored answer
    return fallbackGrading(storedAnswer, studentAnswer);
  }
}

/**
 * Fallback grading using stored answer
 * @param {string} storedAnswer 
 * @param {string} studentAnswer 
 * @returns {Object}
 */
function fallbackGrading(storedAnswer, studentAnswer) {
  const similarity = calculateBasicSimilarity(studentAnswer, storedAnswer);
  return {
    isCorrect: similarity >= 0.7,
    confidence: similarity,
    reason: similarity >= 0.7 ? 'Answer matches expected content' : 'Answer does not match expected content',
    scoreAwarded: Math.round(similarity * 10) / 10,
    percentageScore: Math.round(similarity * 100),
    analysis: 'Used stored answer as fallback (AI generation failed)',
    missingConcepts: [],
    method: 'fallback_similarity'
  };
}

/**
 * Generate a beginner-friendly explanation for why an answer is correct
 * @param {Object} params
 * @param {string} params.question - The question text
 * @param {string} params.correctAnswer - The correct answer
 * @param {string} params.studentAnswer - The student's answer (optional)
 * @returns {Promise<string>} - Beginner-friendly explanation
 */
export async function generateExplanation({ question, correctAnswer, studentAnswer = '' }) {
  if (!genAI) {
    return 'AI explanation service is not available at the moment.';
  }

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: {
      temperature: 0.3, // Slightly higher for more natural, conversational tone
      maxOutputTokens: 512
    }
  });

  const prompt = `${PROMPT_C_EXPLAIN}

Question: ${question}

Correct Answer: ${correctAnswer}

${studentAnswer ? `Student's Answer: ${studentAnswer}` : ''}

Explanation:`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    let explanation = response.text().trim();

    // Clean up the response
    explanation = explanation
      .replace(/^explanation:/i, '')
      .replace(/\*\*/g, '') // Remove bold markers
      .replace(/\*/g, '')   // Remove italic markers
      .replace(/^[-•]\s*/gm, '') // Remove bullet points at start of lines
      .trim();

    // Validate - must not be empty
    if (!explanation || explanation.length < 10) {
      return 'The correct answer is the one shown above. Review the key concepts and try again!';
    }

    return explanation;
  } catch (error) {
    console.error('Error generating explanation:', error);
    return 'The correct answer is shown above. Take a moment to review the concept and try the next question!';
  }
}
