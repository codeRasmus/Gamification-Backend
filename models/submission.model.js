const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema({
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Task",
    required: true,
  },
  answer: { type: String, required: true },
});

const submissionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
  },
  teamName: { type: String, required: true },
  answers: [answerSchema],
  submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Submission", submissionSchema);
