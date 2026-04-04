import db from '../src/config/db.js';

const seedChallengeData = async () => {
  try {
    // First, check if we have a challenge room, if not create one
    const [rooms] = await db.promise().query('SELECT id FROM challenge_rooms LIMIT 1');
    
    let roomId;
    if (rooms.length === 0) {
      // Get first two users to be host and opponent
      const [users] = await db.promise().query('SELECT id FROM users LIMIT 2');
      if (users.length < 2) {
        console.log('Need at least 2 users to create sample challenge room');
        return;
      }
      
      const [roomResult] = await db.promise().query(
        `INSERT INTO challenge_rooms (room_code, host_id, opponent_id, subject, difficulty, question_count, time_per_question, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['ABC123', users[0].id, users[1].id, 'Math', 'medium', 5, 10, 'completed']
      );
      roomId = roomResult.insertId;
      console.log('Created sample challenge room with ID:', roomId);
      
      // Add participants
      await db.promise().query(
        `INSERT INTO challenge_participants (room_id, user_id, score, correct_answers, total_answered, is_ready)
         VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)`,
        [roomId, users[0].id, 45, 4, 5, true, roomId, users[1].id, 30, 3, 5, true]
      );
    } else {
      roomId = rooms[0].id;
    }

    // Get available question IDs (1-30 from seedData)
    const [questions] = await db.promise().query(
      'SELECT id FROM questions WHERE id <= 30 ORDER BY id LIMIT 5'
    );

    if (questions.length === 0) {
      console.log('No questions available. Please seed questions first.');
      return;
    }

    // Clear existing challenge questions for this room
    await db.promise().query('DELETE FROM challenge_questions WHERE room_id = ?', [roomId]);

    // Insert sample challenge questions
    const insertSql = `
      INSERT INTO challenge_questions (room_id, question_id, question_order)
      VALUES (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?), (?, ?, ?)
    `;
    
    const values = [];
    questions.forEach((q, index) => {
      values.push(roomId, q.id, index + 1);
    });

    await db.promise().query(insertSql, values);
    console.log(`Added ${questions.length} sample questions to challenge room ${roomId}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding challenge questions:', error);
    process.exit(1);
  }
};

seedChallengeData();
