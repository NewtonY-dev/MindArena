// Mock contest data for development
const mockContests = [
  {
    id: 1,
    title: 'Weekly Math Challenge',
    description: 'Test your math skills in this timed challenge!',
    subject: 'Mathematics',
    difficulty: 'medium',
    duration: 10, // minutes
    questionCount: 10,
    startDate: '2026-04-01',
    endDate: '2026-04-07',
    status: 'available',
    prize: '50 points',
    participants: 15,
    maxParticipants: 100
  },
  {
    id: 2,
    title: 'Science Olympiad',
    description: 'Comprehensive science quiz covering physics, chemistry, and biology.',
    subject: 'Science',
    difficulty: 'hard',
    duration: 15,
    questionCount: 15,
    startDate: '2026-04-10',
    endDate: '2026-04-20',
    status: 'upcoming',
    prize: '100 points',
    participants: 8,
    maxParticipants: 50
  },
  {
    id: 3,
    title: 'Quick Quiz - Easy',
    description: 'A quick warm-up quiz for beginners.',
    subject: 'General',
    difficulty: 'easy',
    duration: 5,
    questionCount: 5,
    startDate: '2026-03-01',
    endDate: '2026-03-31',
    status: 'ended',
    prize: '20 points',
    participants: 45,
    maxParticipants: 200
  },
  {
    id: 4,
    title: 'Coding Challenge',
    description: 'Test your programming skills with coding problems.',
    subject: 'Computer Science',
    difficulty: 'hard',
    duration: 20,
    questionCount: 8,
    startDate: '2026-04-15',
    endDate: '2026-04-25',
    status: 'upcoming',
    prize: '150 points',
    participants: 3,
    maxParticipants: 30
  },
  {
    id: 5,
    title: 'History Bee',
    description: 'Test your knowledge of world history!',
    subject: 'History',
    difficulty: 'medium',
    duration: 12,
    questionCount: 12,
    startDate: '2026-03-15',
    endDate: '2026-03-25',
    status: 'ended',
    prize: '75 points',
    participants: 22,
    maxParticipants: 75
  }
];

const getContests = async (req, res) => {
  try {
    const { difficulty } = req.query;
    
    // Filter by difficulty if provided
    let contests = mockContests;
    if (difficulty) {
      contests = contests.filter(contest => contest.difficulty === difficulty);
    }

    res.json({
      success: true,
      contests: contests,
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
    const contest = mockContests.find(c => c.id === parseInt(id));
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    res.json({
      success: true,
      contest
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
    
    const contest = mockContests.find(c => c.id === parseInt(id));
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    if (contest.status !== 'available') {
      return res.status(400).json({
        success: false,
        error: 'Contest is not available'
      });
    }

    // In a real implementation, you would:
    // 1. Check if user has already participated
    // 2. Create contest participation record
    // 3. Start timer
    // 4. Generate contest-specific questions
    
    res.json({
      success: true,
      message: 'Contest started successfully',
      contest: {
        ...contest,
        startTime: new Date().toISOString(),
        questions: [] // Would be populated with actual questions
      }
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
    const { contestId, questionId, answer } = req.body;
    const userId = req.user.id;
    
    // In a real implementation, you would:
    // 1. Validate contest participation
    // 2. Check time remaining
    // 3. Validate answer
    // 4. Calculate points based on speed and accuracy
    // 5. Update contest score
    
    const isCorrect = Math.random() > 0.5; // Mock validation
    const points = isCorrect ? 10 : 0;
    
    res.json({
      success: true,
      isCorrect,
      pointsAwarded: points,
      totalPoints: points // Would be cumulative in real implementation
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
    
    // Mock leaderboard data
    const mockLeaderboard = [
      { rank: 1, userId: 1, displayName: 'Alice Johnson', score: 145, accuracy: 92.5 },
      { rank: 2, userId: 2, displayName: 'Bob Smith', score: 138, accuracy: 89.2 },
      { rank: 3, userId: 3, displayName: 'Charlie Brown', score: 125, accuracy: 87.8 },
      { rank: 4, userId: 4, displayName: 'Diana Wilson', score: 118, accuracy: 85.3 },
      { rank: 5, userId: 5, displayName: 'Eve Davis', score: 105, accuracy: 82.1 }
    ];
    
    res.json({
      success: true,
      leaderboard: mockLeaderboard,
      totalParticipants: mockLeaderboard.length
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
    
    const contest = mockContests.find(c => c.id === parseInt(contestId));
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    if (contest.status !== 'upcoming') {
      return res.status(400).json({
        success: false,
        error: 'Can only register for upcoming contests'
      });
    }

    // In a real implementation, you would:
    // 1. Check if user already registered
    // 2. Create registration record in database
    // 3. Send confirmation notification
    
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
    
    const contest = mockContests.find(c => c.id === parseInt(contestId));
    
    if (!contest) {
      return res.status(404).json({
        success: false,
        error: 'Contest not found'
      });
    }

    // In a real implementation, you would:
    // 1. Remove registration record from database
    // 2. Send cancellation notification
    
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
    
    // In a real implementation, you would:
    // 1. Query database for user's contest registrations
    // 2. Return list of registered contest IDs
    
    // Mock data - return registrations for upcoming contests
    const upcomingContests = mockContests.filter(c => c.status === 'upcoming');
    const registeredContests = upcomingContests.slice(0, 1); // Mock: user registered for first upcoming contest
    
    res.json({
      success: true,
      registrations: registeredContests.map(c => c.id)
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
