import db from '../config/db.js';

export const seedGradeLevels = () => {
  const sql = `
    INSERT IGNORE INTO grade_levels (id, name) VALUES
    (9, 'Grade 9'), (10, 'Grade 10'),
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

export const seedGradeSubjects = () => {
  const sql = `
    INSERT IGNORE INTO grade_subjects (grade_level_id, subject_id) VALUES
    (9,1),(9,2),(9,3),(9,4),(9,5),(9,6),(9,7),(9,8),(9,9),
    (10,1),(10,2),(10,3),(10,4),(10,5),(10,6),(10,7),(10,8),(10,9),
    (11,1),(11,2),(11,3),(11,4),(11,5),(11,6),(11,7),(11,8),(11,9),
    (12,1),(12,2),(12,3),(12,4),(12,5),(12,6),(12,7),(12,8),(12,9)
  `;
  return new Promise((resolve, reject) => {
    db.query(sql, (err) => {
      if (err) reject(err);
      else { console.log('Grade subjects seeded successfully'); resolve(); }
    });
  });
};

export const seedQuestions = () => {
  const sql = `
    INSERT IGNORE INTO questions (id, grade_level_id, subject_id, content, correct_answer, hint, difficulty_level) VALUES
    -- Math Questions - Grade 10
    (11, 10, 1, 'Solve: 2xÂ² + 5x - 3 = 0', 'x = 0.5, x = -3', 'Use the quadratic formula.', 'hard'),
    (12, 10, 1, 'What is the derivative of xÂ³ + 2x?', '3xÂ² + 2', 'Apply the power rule.', 'hard'),
    (13, 10, 1, 'Find sin(30Â°)', '0.5', 'Remember the unit circle values.', 'medium'),
    (14, 10, 1, 'What is logâ‚‚(8)?', '3', '2 to what power equals 8?', 'medium'),
    (15, 10, 1, 'Solve: |2x - 1| = 5', 'x = 3, x = -2', 'Consider both positive and negative cases.', 'hard'),

    -- English Questions - Grade 10
    (16, 10, 2, 'Identify the literary device: "The wind whispered through the trees"', 'personification', 'Giving human qualities to non-human things.', 'medium'),
    (17, 10, 2, 'What is a thesis statement?', 'Main argument of an essay', 'It appears in the introduction.', 'medium'),
    (18, 10, 2, 'Correct the sentence: Him and me went to the store.', 'He and I went to the store', 'Use subject pronouns.', 'easy'),
    (19, 10, 2, 'What is a metaphor?', 'Comparison without using "like" or "as"', 'Direct comparison between two unlike things.', 'medium'),
    (20, 10, 2, 'Identify the clause type in "When the rain stops, we will play"', 'subordinate clause', 'It cannot stand alone as a sentence.', 'hard'),

    -- Math Questions - Grade 12 (for grade 12 students)
    (21, 12, 1, 'What is the limit of (xÂ² - 1)/(x - 1) as x approaches 1?', '2', 'Factor the numerator.', 'hard'),
    (22, 12, 1, 'Find the integral of 2x dx', 'xÂ² + C', 'Use the power rule for integration.', 'medium'),
    (23, 12, 1, 'What is the value of e^(iÏ€) + 1?', '0', 'This is Euler identity.', 'hard'),
    (24, 12, 1, 'Solve for x: ln(x) = 3', 'eÂ³ or approximately 20.09', 'Exponentiate both sides.', 'medium'),
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
    await seedGradeSubjects();
    await seedQuestions();
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};
