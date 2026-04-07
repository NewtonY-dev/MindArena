import { 
  getAllSubjects, 
  getSubjectById, 
  getSubjectsByGradeLevel, 
  createSubject 
} from "../models/subject.model.js";
import { isDatabaseAvailable } from "../utils/dbHelpers.js";

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

export const getAllSubjectsHandler = async (req, res) => {
  try {
    if (!isDatabaseAvailable()) {
      console.log('Database not available, using mock subjects');
      return res.json({ subjects: mockSubjects });
    }

    const subjects = await getAllSubjects();
    res.json({ subjects });
  } catch (error) {
    console.error("Error getting subjects:", error);
    console.log('Database error, using mock subjects');
    res.json({ subjects: mockSubjects });
  }
};

export const getSubjectByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;
    
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
    console.log('Database error, using mock subject');
    const { id } = req.params;
    const subject = mockSubjects.find(s => s.id === parseInt(id));
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }
    res.json({ subject });
  }
};

export const getSubjectsByGradeHandler = async (req, res) => {
  try {
    const { gradeLevelId } = req.params;
    
    if (!isDatabaseAvailable()) {
      console.log('Database not available, using mock subjects for grade level');
      return res.json({ subjects: mockSubjects });
    }

    const subjects = await getSubjectsByGradeLevel(gradeLevelId);
    res.json({ subjects });
  } catch (error) {
    console.error("Error getting subjects by grade level:", error);
    console.log('Database error, using mock subjects for grade level');
    res.json({ subjects: mockSubjects });
  }
};

export const createSubjectHandler = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Subject name is required" });
    }
    
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
};
