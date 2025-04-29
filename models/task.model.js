const mongoose = require("mongoose");

const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: String,
  pointCost: Number,
  pointReward: Number,
  timeLimit: Number,
});

module.exports = mongoose.model("Task", taskSchema);
