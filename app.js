const express = require("express");
const mongoose = require("mongoose");
const taskRoutes = require("./routes/task.routes");
// const teamRoutes = require("./routes/team.routes");
// const adminRoutes = require("./routes/admin.routes");
require("dotenv").config();

const app = express();
app.use(express.json());

// Routes
app.use("/api/tasks", taskRoutes);
// app.use("/api/teams", teamRoutes);
// app.use("/api/admin", adminRoutes);

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(3000, () => console.log("Server running on http://localhost:3000"));
  })
  .catch((err) => console.error("MongoDB connection error:", err));
