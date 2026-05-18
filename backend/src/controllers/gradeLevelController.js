import { 
  getAllGradeLevels, 
  getGradeLevelById, 
  createGradeLevel 
} from "../models/gradeLevel.model.js";
import { getSubjectsByGradeLevel } from "../models/gradeSubject.model.js";

export const getAllGradeLevelsHandler = async (req, res) => {
  try {
    const gradeLevels = await getAllGradeLevels();
    res.json({ gradeLevels });
  } catch (error) {
    console.error("Error getting grade levels:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getGradeLevelByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const gradeLevel = await getGradeLevelById(id);
    
    if (!gradeLevel) {
      return res.status(404).json({ error: "Grade level not found" });
    }
    
    res.json({ gradeLevel });
  } catch (error) {
    console.error("Error getting grade level:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const createGradeLevelHandler = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: "Grade level name is required" });
    }
    
    const gradeLevelId = await createGradeLevel(name);
    res.status(201).json({ 
      message: "Grade level created successfully",
      gradeLevelId 
    });
  } catch (error) {
    console.error("Error creating grade level:", error);
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(409).json({ error: "Grade level name already exists" });
    } else {
      res.status(500).json({ error: "Internal server error" });
    }
  }
};

export const getGradeLevelSubjectsHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const subjects = await getSubjectsByGradeLevel(id);
    res.json({ subjects });
  } catch (error) {
    console.error("Error getting grade level subjects:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
