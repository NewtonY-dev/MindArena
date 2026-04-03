const authMiddleware = (req, res, next) => {
  // TODO: Implement actual JWT verification
  next();
};

export default authMiddleware;