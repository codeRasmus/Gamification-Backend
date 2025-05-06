const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socket = require("./socket"); // ✅ import your socket module
const taskRoutes = require("./routes/task.routes");
const adminRoutes = require("./routes/admin.routes");
require("dotenv").config();
const Task = require("./models/task.model");

const app = express();
const server = http.createServer(app);
const io = socket.init(server); // ✅ initialize and get io instance

let kode = 1;

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

const VALID_TEAMS = ["Alpha", "Beta", "Delta", "Sigma", "Omega"];
const sessions = {};

const getConnectedTeamsList = () => {
  return Object.keys(connectedTeams).join(", ");
};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);
  socket.on("game_start", () => {
    console.log("Game started");
  });

  socket.on("join-team", ({ teamName, sessionId }) => {
    if (!VALID_TEAMS.includes(teamName)) {
      socket.emit("error", "Ugyldigt holdnavn");
      return;
    }

    if (!sessions[sessionId]) {
      sessions[sessionId] = {};
    }

    const teamSlots = sessions[sessionId];

    if (teamSlots[teamName]) {
      socket.emit("error", `Holdet ${teamName} er allerede optaget.`);
      return;
    }
    teamSlots[teamName] = socket.id;
    socket.join(sessionId);
    socket.join(teamName);

    socket.emit("joined", { teamName, sessionId });
    console.log(`Team ${teamName} joined in session ${sessionId}`);
    io.to(sessionId).emit("team-update", teamSlots);

    socket.on("disconnect", () => {
      console.log(`Socket ${socket.id} disconnected from team ${teamName}`);

      if (sessions[sessionId] && sessions[sessionId][teamName] === socket.id) {
        delete sessions[sessionId][teamName];
        const stillConnected = Object.keys(sessions[sessionId]).length;
        if (!stillConnected) delete sessions[sessionId];
      }
    });
  });
  socket.on("host-join", ({ sessionId }) => {
    socket.join(sessionId);
    console.log(`Host joined session ${sessionId}`);
  });
  socket.on("start-game", async ({ sessionId, selectedTaskIds }) => {
    try {
      // Valider at session findes
      const session = sessions[sessionId];
      if (!session) {
        socket.emit("error", "Ugyldig session");
        return;
      }

      // Hent valgte opgaver med Mongoose
      const tasks = await Task.find({
        _id: { $in: selectedTaskIds },
      }).lean(); // lean() gør det lettere at arbejde med dataen

      for (const [teamName, teamData] of Object.entries(sessions[sessionId])) {
        const randomTask = tasks[Math.floor(Math.random() * tasks.length)];
        const socketId = teamData.socketId;

        teamData.task = randomTask;
        io.to(socketId).emit("receive-task", randomTask);
      }

      console.log(
        `Spillet er startet i session ${sessionId} med ${tasks.length} opgaver`
      );
    } catch (err) {
      console.error("Fejl i start-game:", err);
      socket.emit("error", "Kunne ikke starte spillet");
    }
  });
});

// MongoDB connection and server start
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(5500, () => {
      console.log("Server running on http://localhost:5500");
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));
