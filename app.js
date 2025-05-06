const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socket = require("./socket"); // ✅ import your socket module
const taskRoutes = require("./routes/task.routes");
const adminRoutes = require("./routes/admin.routes");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = socket.init(server); // ✅ initialize and get io instance

let kode = 1;

// Middleware for CORS og JSON parsing
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/tasks", taskRoutes);
app.use("/api/admin", adminRoutes);

const VALID_TEAMS = ["Alpha", "Beta", "Delta", "Sigma", "Omega"];
const connectedTeams = {}; // { teamName: socketId }

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
      console.log(
        updatedList
          ? `Nu er ${updatedList} tilsluttet.`
          : "Ingen teams er tilsluttet."
      );
    });
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
