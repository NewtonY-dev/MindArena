import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: "Authorization token required" });
    }
    
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: "Invalid token" });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: "Token expired" });
    } else {
      console.error("Auth middleware error:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  }
};

export default authMiddleware;