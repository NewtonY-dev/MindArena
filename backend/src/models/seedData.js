import db from '../config/db.js';

export const seedGradeLevels = () => {
  const sql = `
    INSERT IGNORE INTO grade_levels (id, name) VALUES
    (1, 'Grade 1'), (2, 'Grade 2'), (3, 'Grade 3'), (4, 'Grade 4'), (5, 'Grade 5'),
    (6, 'Grade 6'), (7, 'Grade 7'), (8, 'Grade 8'), (9, 'Grade 9'), (10, 'Grade 10'),
    (11, 'Grade 11'), (12, 'Grade 12')
  `;
  return new Promise((resolve, reject) => {
    db.query(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('Grade levels seeded successfully');
        resolve();
      }
    });
  });
};

export const seedSubjects = () => {
  const sql = `
    INSERT IGNORE INTO subjects (id, name) VALUES
    (1, 'Math'), (2, 'English'), (3, 'Science'), (4, 'History'), (5, 'Geography')
  `;
  return new Promise((resolve, reject) => {
    db.query(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('Subjects seeded successfully');
        resolve();
      }
    });
  });
};

export const seedQuestions = () => {
  const sql = `
    INSERT IGNORE INTO questions (id, grade_level_id, subject_id, content, correct_answer, hint, difficulty_level) VALUES
    -- Math Questions - Grade 5
    (1, 5, 1, 'What is 15 + 27?', '42', 'Add the tens and ones separately.', 'easy'),
    (2, 5, 1, 'What is 8 × 7?', '56', 'Think of it as 8 groups of 7.', 'easy'),
    (3, 5, 1, 'What is 144 ÷ 12?', '12', 'Think of what number multiplied by 12 equals 144.', 'medium'),
    (4, 5, 1, 'Solve for x: 3x = 12', '4', 'Divide both sides by 3.', 'medium'),
    (5, 5, 1, 'What is the perimeter of a rectangle with length 8 and width 5?', '26', 'Add all four sides: 8 + 8 + 5 + 5.', 'medium'),
    
    -- English Questions - Grade 5
    (6, 5, 2, 'What is the past tense of "go"?', 'went', 'This is an irregular verb.', 'easy'),
    (7, 5, 2, 'Which is a noun: run, running, or runner?', 'runner', 'A noun names a person, place, or thing.', 'easy'),
    (8, 5, 2, 'Complete the sentence: The dog ___ over the fence.', 'jumped', 'Use past tense for a completed action.', 'easy'),
    (9, 5, 2, 'What is the plural of "child"?', 'children', 'This is an irregular plural.', 'medium'),
    (10, 5, 2, 'Which word is an adjective in "The big red ball"?', 'big, red', 'Adjectives describe nouns.', 'medium'),
    
    -- Math Questions - Grade 10
    (11, 10, 1, 'Solve: 2x² + 5x - 3 = 0', 'x = 0.5, x = -3', 'Use the quadratic formula.', 'hard'),
    (12, 10, 1, 'What is the derivative of x³ + 2x?', '3x² + 2', 'Apply the power rule.', 'hard'),
    (13, 10, 1, 'Find sin(30°)', '0.5', 'Remember the unit circle values.', 'medium'),
    (14, 10, 1, 'What is log₂(8)?', '3', '2 to what power equals 8?', 'medium'),
    (15, 10, 1, 'Solve: |2x - 1| = 5', 'x = 3, x = -2', 'Consider both positive and negative cases.', 'hard'),
    
    -- English Questions - Grade 10
    (16, 10, 2, 'Identify the literary device: "The wind whispered through the trees"', 'personification', 'Giving human qualities to non-human things.', 'medium'),
    (17, 10, 2, 'What is a thesis statement?', 'Main argument of an essay', 'It appears in the introduction.', 'medium'),
    (18, 10, 2, 'Correct the sentence: Him and me went to the store.', 'He and I went to the store', 'Use subject pronouns.', 'easy'),
    (19, 10, 2, 'What is a metaphor?', 'Comparison without using "like" or "as"', 'Direct comparison between two unlike things.', 'medium'),
    (20, 10, 2, 'Identify the clause type in "When the rain stops, we will play"', 'subordinate clause', 'It cannot stand alone as a sentence.', 'hard'),
    
    -- Math Questions - Grade 12 (for grade 12 students)
    (21, 12, 1, 'What is the limit of (x² - 1)/(x - 1) as x approaches 1?', '2', 'Factor the numerator.', 'hard'),
    (22, 12, 1, 'Find the integral of 2x dx', 'x² + C', 'Use the power rule for integration.', 'medium'),
    (23, 12, 1, 'What is the value of e^(iπ) + 1?', '0', 'This is Euler identity.', 'hard'),
    (24, 12, 1, 'Solve for x: ln(x) = 3', 'e³ or approximately 20.09', 'Exponentiate both sides.', 'medium'),
    (25, 12, 1, 'What is the determinant of [[1, 2], [3, 4]]?', '-2', 'Use the formula ad - bc.', 'medium'),
    
    -- English Questions - Grade 12
    (26, 12, 2, 'What is the theme of a literary work?', 'Central idea or message', 'It is the underlying meaning.', 'medium'),
    (27, 12, 2, 'Define "dramatic irony"', 'When audience knows more than characters', 'The audience has superior knowledge.', 'hard'),
    (28, 12, 2, 'What is an unreliable narrator?', 'A narrator whose credibility is compromised', 'Question the narrator truthfulness.', 'hard'),
    (29, 12, 2, 'Correct the error: Neither the students nor the teacher were ready.', 'was ready', 'Use singular verb with neither...nor.', 'medium'),
    (30, 12, 2, 'What is a bildungsroman?', 'A coming-of-age story', 'Focuses on psychological and moral growth.', 'hard')
  `;
  return new Promise((resolve, reject) => {
    db.query(sql, (err) => {
      if (err) reject(err);
      else {
        console.log('Questions seeded successfully');
        resolve();
      }
    });
  });
};

export const seedDatabase = async () => {
  try {
    await seedGradeLevels();
    await seedSubjects();
    await seedQuestions();
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};
