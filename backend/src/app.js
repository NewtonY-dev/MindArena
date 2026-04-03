import express from "express";
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import practiceRoutes from "./routes/practiceRoutes.js";
import attemptRoutes from "./routes/attemptRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";

const app = express();

// Middleware
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'MindArena API is running' });
});

// Mount routes with proper base paths
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/practice", practiceRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/leaderboard", leaderboardRoutes);

export default app;
