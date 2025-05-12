const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socket = require("./socket");
const taskRoutes = require("./routes/task.routes");
const adminRoutes = require("./routes/admin.routes");
const submissionRoutes = require("./routes/submission.routes");
const Task = require("./models/task.model");
const game = require("./utils/gameSessionManager");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socket.init(server);

const hostSessions = new Set();

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.text({ type: "text/csv" }));
app.use(express.urlencoded({ extended: true }));
app.use("/api/tasks", taskRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/submission", submissionRoutes);

const VALID_TEAMS = ["Alpha", "Beta", "Delta", "Sigma", "Omega"];

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  // Join team
  socket.on("join-team", ({ teamName, sessionId }) => {
    if (!VALID_TEAMS.includes(teamName)) {
      return socket.emit("error", "Ugyldigt holdnavn");
    }

    if (!hostSessions.has(sessionId)) {
      return socket.emit("session-not-found");
    }

    const joined = game.joinTeam(sessionId, teamName, socket.id);
    if (!joined) {
      return socket.emit("error", `Holdet ${teamName} er allerede optaget.`);
    }

    socket.join(sessionId);
    socket.join(teamName);
    socket.emit("joined", { teamName, sessionId });

    console.log(`✅ Team ${teamName} joined session ${sessionId}`);
    io.to(sessionId).emit("team-update", game.getSession(sessionId).teams);
  });

  // Host joiner spil
  socket.on("host-join", ({ sessionId }) => {
    socket.join(sessionId);
    hostSessions.add(sessionId);
    console.log(`Host joined session ${sessionId}`);
    console.log(hostSessions);
  });

  // Start spillet og send første opgave til hvert hold
  socket.on("start-game", async ({ sessionId, selectedTaskIds }) => {
    try {
      const tasks = await Task.find({ _id: { $in: selectedTaskIds } }).lean();
      if (!tasks.length) return socket.emit("error", "Ingen opgaver valgt");

      game.createSession(sessionId, tasks);

      const session = game.getSession(sessionId);
      console.log("🔍 TEAMS I SESSION:", session.teams);
      for (const teamName in session.teams) {
        const socketId = session.teams[teamName].socketId;
        const firstTask = game.assignTaskQueue(sessionId, teamName, tasks);
        console.log(`📤 Sender receive-task til ${teamName} via socket ${socketId}`);

        io.to(socketId).emit("receive-task", firstTask);
      }

      console.log(`Spil startet for session ${sessionId}`);
    } catch (err) {
      console.error("Fejl i start-game:", err);
      socket.emit("error", "Kunne ikke starte spillet");
    }
  });

  // Næste opgave
  socket.on("next-task", ({ sessionId, teamName }) => {
    const session = game.getSession(sessionId);
    if (!session) return;

    const nextTask = game.getNextTask(sessionId, teamName);
    const socketId = session.teams[teamName]?.socketId;
    if (!socketId) return;

    if (nextTask) {
      io.to(socketId).emit("receive-task", nextTask);
    } else {
      io.to(socketId).emit("no-more-tasks");
    }
  });

  // Scoreboard-forespørgsel
  socket.on("get-session-status", ({ sessionId }) => {
    const session = game.getSession(sessionId);
    if (!session) return socket.emit("error", "Session ikke fundet");

    const scoreboard = {};
    for (const [teamName, queueData] of Object.entries(session.taskQueues)) {
      const task = queueData.queue[queueData.index];
      const time = queueData.startTime
        ? Math.max((queueData.duration || 0) - Math.floor((Date.now() - queueData.startTime) / 1000), 0)
        : 0;

      scoreboard[teamName] = {
        task,
        time,
      };
    }

    socket.emit("session-status", scoreboard);
  });
  socket.on("validate-session", ({ sessionId }) => {
    if (!hostSessions.has(sessionId)) {
      return socket.emit("session-not-found");
    }

    socket.emit("session-valid");
  });
  socket.on("disconnect", () => {
    // Hvis det er en host, fjern sessionen
    for (const sessionId of hostSessions) {
      const session = game.getSession(sessionId);
      if (session && Object.values(session.teams).some((team) => team.socketId === socket.id)) {
        console.log(`Host eller team forlod session ${sessionId}`);
        // Hvis du har tracking på hostens socketId separat, kan du gøre det mere præcist
      }
    }
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(5500, () => {
      console.log("Server running on http://localhost:5500");
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));
