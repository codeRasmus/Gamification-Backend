const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const taskRoutes = require("./routes/task.routes");
const adminRoutes = require("./routes/admin.routes");
require("dotenv").config();

const kode = 123456;

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

// Middleware for CORS og JSON parsing
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruter
app.use("/api/tasks", taskRoutes);
app.use("/api/admin", adminRoutes);

const VALID_TEAMS = ["Alpha", "Beta", "Delta", "Sigma", "Omega"];
const connectedTeams = {}; // { teamName: socketId }

// Aktuel liste over tilsluttede teams
const getConnectedTeamsList = () => {
  return Object.keys(connectedTeams).join(", ");
};

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join-team", ({ teamName, sessionId }) => {
    if (!VALID_TEAMS.includes(teamName)) {
      socket.emit("error", "Ugyldigt holdnavn");
      return;
    }

    if (connectedTeams[teamName]) {
      socket.emit("error", `Holdet ${teamName} er allerede optaget.`);
      return;
    }

    connectedTeams[teamName] = socket.id;
    socket.join(teamName);

    socket.emit("joined", { teamName, sessionId });
    console.log(`Team ${teamName} joined with sessionID: ${sessionId}`);
    console.log(`Nu er ${getConnectedTeamsList()} tilsluttet.`);

    socket.on("disconnect", () => {
      console.log(`Team ${teamName} disconnected`);
      delete connectedTeams[teamName];

      const updatedList = getConnectedTeamsList();
      console.log(updatedList ? `Nu er ${updatedList} tilsluttet.` : "Ingen teams er tilsluttet.");
    });
  });
});

function startGame() {
  io.emit("game_start", {
    message: "Game is starting! Please go to the game page.",
  });
}

// MongoDB-forbindelse og server start
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    server.listen(5500, () => {
      console.log("Server running on http://localhost:5500");
    });
  })
  .catch((err) => console.error("MongoDB connection error:", err));
