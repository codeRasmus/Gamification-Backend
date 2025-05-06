const express = require("express");
const mongoose = require("mongoose");
const taskRoutes = require("./routes/task.routes");
const cors = require("cors");
// const teamRoutes = require("./routes/team.routes");
const adminRoutes = require("./routes/admin.routes");
require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route setup
app.use("/api/tasks", taskRoutes);
// app.use("/api/teams", teamRoutes);
app.use("/api/admin", adminRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(5500, () => console.log("Server running on http://localhost:5500"));
  })
  .catch((err) => console.error("MongoDB connection error:", err));
