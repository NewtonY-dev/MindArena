import express from "express";
import { 
  getAllSubjects, 
  getSubjectById, 
  getSubjectsByGradeLevel, 
  createSubject 
} from "../models/subject.model.js";
import authMiddleware from "../middleware/authMiddleware.js";
import db from "../config/db.js";

const router = express.Router();

// Mock subjects data for when database is not available
const mockSubjects = [
  { id: 1, name: "Mathematics" },
  { id: 2, name: "English" },
  { id: 3, name: "Science" },
  { id: 4, name: "Geography" },
  { id: 5, name: "History" },
  { id: 6, name: "Physics" },
  { id: 7, name: "Chemistry" },
  { id: 8, name: "Biology" }
];

// Helper function to check if database is available
const isDatabaseAvailable = () => {
  try {
    return db && db.query;
  } catch (error) {
    return false;
  }
};

// Get All Subjects (Public)
router.get("/", async (req, res) => {
  try {
    // Check if database is available
    if (!isDatabaseAvailable()) {
      console.log('Database not available, using mock subjects');
      return res.json({ subjects: mockSubjects });
    }

    const subjects = await getAllSubjects();
    res.json({ subjects });
  } catch (error) {
    console.error("Error getting subjects:", error);
    // Fallback to mock data on error
    console.log('Database error, using mock subjects');
    res.json({ subjects: mockSubjects });
  }
});

// Get Subject by ID (Public)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if database is available
    if (!isDatabaseAvailable()) {
      console.log('Database not available, using mock subject');
      const subject = mockSubjects.find(s => s.id === parseInt(id));
      if (!subject) {
        return res.status(404).json({ error: "Subject not found" });
      }
      return res.json({ subject });
    }

    const subject = await getSubjectById(id);
    
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }
    
    res.json({ subject });
  } catch (error) {
    console.error("Error getting subject:", error);
    // Fallback to mock data on error
    console.log('Database error, using mock subject');
    const { id } = req.params;
    const subject = mockSubjects.find(s => s.id === parseInt(id));
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }
    res.json({ subject });
  }
});

// Get Subjects by Grade Level (Public)
router.get("/grade/:gradeLevelId", async (req, res) => {
  try {
    const { gradeLevelId } = req.params;
    
    // Check if database is available
    if (!isDatabaseAvailable()) {
      console.log('Database not available, using mock subjects for grade level');
      return res.json({ subjects: mockSubjects });
    }

    const subjects = await getSubjectsByGradeLevel(gradeLevelId);
    res.json({ subjects });
  } catch (error) {
    console.error("Error getting subjects by grade level:", error);
    // Fallback to mock data on error
    console.log('Database error, using mock subjects for grade level');
    res.json({ subjects: mockSubjects });
  }
});

// Create Subject (Admin only - would need admin middleware)
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Subject name is required" });
    }
    
    // Check if database is available
    if (!isDatabaseAvailable()) {
      console.log('Database not available, cannot create subject');
      return res.status(503).json({ error: "Database not available - cannot create subject" });
    }
    
    const subjectId = await createSubject(name);
    res.status(201).json({ 
      message: "Subject created successfully",
      subjectId 
    });
  } catch (error) {
    console.error("Error creating subject:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: "Subject name already exists" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
});

export default router;
