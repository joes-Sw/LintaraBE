const express = require("express");
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const challengeRouter = require("./routes/challengeRoutes");
const challengeHistoricalRouter = require("./routes/challengeHistoricalRoutes");
const followersRouter = require("./routes/followersRoutes");
const reportsRouter = require("./routes/reportRoutes");
const PostsRouter = require("./routes/postsRoutes");
const likePostRouter = require("./routes/likePostRoutes");
const commentRouter = require("./routes/commentRoutes");
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Base API path
const API_BASE = "/api";

app.use('/api/auth', authRoutes);
app.use(`${API_BASE}/users`, userRoutes);
app.use(`${API_BASE}/challenges`, challengeRouter);
app.use(`${API_BASE}/challenges/historical`, challengeHistoricalRouter);
app.use(`${API_BASE}/followers`, followersRouter);
app.use(`${API_BASE}/reports`, reportsRouter);
app.use(`${API_BASE}/posts`, PostsRouter);
app.use(`${API_BASE}/likePost`, likePostRouter);
app.use(`${API_BASE}/comment`, commentRouter);

app.get("/", (req, res) => res.send("Express on Vercel"));


app.listen(5000, () => console.log("Server ready on port 5000."));

module.exports = app;