// Import og opsætning
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

// Server og Socket.io initialisering
const app = express();
const server = http.createServer(app);
const io = socket.init(server);

// In-memory data
const hostSessions = new Set();
const hostSocketMap = new Map();
const VALID_TEAMS = ["Alpha", "Beta", "Delta", "Sigma", "Omega"];

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.text({ type: "text/csv" }));
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/tasks", taskRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/submission", submissionRoutes);

// Socket.io eventhåndtering
io.on("connection", (socket) => {
  // Event til håndtering når et Team tilslutter sig
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
    io.to(sessionId).emit("team-update", game.getSession(sessionId).teams);
  });

  // Event til når Game Master åbner en spillobby
  socket.on("host-join", ({ sessionId }) => {
    socket.join(sessionId);
    hostSessions.add(sessionId);
    hostSocketMap.set(sessionId, socket.id);
  });

  // Event til når Game Master starter spillet
  socket.on("start-game", async ({ sessionId, selectedTaskIds }) => {
    try {
      const tasks = await Task.find({ _id: { $in: selectedTaskIds } }).lean();
      if (!tasks.length) return socket.emit("error", "Ingen opgaver valgt");

      game.createSession(sessionId, tasks);

      const session = game.getSession(sessionId);

      for (const teamName in session.teams) {
        const socketId = session.teams[teamName].socketId;
        const firstTask = game.assignTaskQueue(sessionId, teamName, tasks);

        io.to(socketId).emit("receive-task", firstTask);
      }
    } catch (err) {
      console.error("Fejl i start-game:", err);
      socket.emit("error", "Kunne ikke starte spillet");
    }
  });

  // Event når brugeren har besvaret et spørgsmål og skal forespørge det næste
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

  // Event til når Game Master skal overvåge en session (sker hvert sekund)
  socket.on("get-session-status", ({ sessionId }) => {
    const session = game.getSession(sessionId);
    if (!session) return socket.emit("error", "Session ikke fundet");

    const scoreboard = {};
    for (const [teamName, queueData] of Object.entries(session.taskQueues)) {
      const task = queueData.queue[queueData.index];
      const time = queueData.startTime
        ? Math.max(
            (queueData.duration || 0) -
              Math.floor((Date.now() - queueData.startTime) / 1000),
            0
          )
        : 0;

      scoreboard[teamName] = {
        task,
        time,
      };
    }

    socket.emit("session-status", scoreboard);
  });

  // Event til at håndtere om brugerens sessionskode er gylding
  socket.on("validate-session", ({ sessionId }) => {
    if (!hostSessions.has(sessionId)) {
      return socket.emit("session-not-found");
    }
    socket.emit("session-valid");
  });

  // Event til at håndtere når en bruger disconnecter fra spillet
  socket.on("disconnect", () => {
    for (const [sessionId, hostSocketId] of hostSocketMap.entries()) {
      if (hostSocketId === socket.id) {
        hostSessions.delete(sessionId);
        hostSocketMap.delete(sessionId);
        game.removeSession(sessionId);
      }
    }
  });
});

// Opsætning af MongoDB forbindelse
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    server.listen(5500, () => {
      console.log("Server running on http://localhost:5500");
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));
