const adminMiddleware = (req, res, next) => {
  try {
    console.log('Admin middleware - checking user:', req.user);
    
    if (!req.user) {
      console.log('Admin middleware - no user found, returning 401');
      return res.status(401).json({ error: "Authentication required" });
    }

    console.log('Admin middleware - user role:', req.user.role);
    
    if (req.user.role !== 'admin') {
      console.log('Admin middleware - user is not admin, returning 403');
      return res.status(403).json({ error: "Admin access required" });
    }

    console.log('Admin middleware - user verified as admin, proceeding');
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export default adminMiddleware;
