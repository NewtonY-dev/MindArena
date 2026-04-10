import { 
  getAllSubjects, 
  getSubjectById, 
  getSubjectsByGradeLevel, 
  createSubject 
} from "../models/subject.model.js";

export const getAllSubjectsHandler = async (req, res) => {
  try {
    const subjects = await getAllSubjects();
    res.json({ subjects });
  } catch (error) {
    console.error("Error getting subjects:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSubjectByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const subject = await getSubjectById(id);
    
    if (!subject) {
      return res.status(404).json({ error: "Subject not found" });
    }
    
    res.json({ subject });
  } catch (error) {
    console.error("Error getting subject:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getSubjectsByGradeHandler = async (req, res) => {
  try {
    const { gradeLevelId } = req.params;
    const subjects = await getSubjectsByGradeLevel(gradeLevelId);
    res.json({ subjects });
  } catch (error) {
    console.error("Error getting subjects by grade level:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createSubjectHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    const { name } = req.body;
    
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    if (userRole !== 'admin') {
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }
    
    if (!name) {
      return res.status(400).json({ error: "Subject name is required" });
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
