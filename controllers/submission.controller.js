const Submission = require("../models/submission.model");

exports.createSubmission = async (req, res) => {
  try {
    const submission = new Submission(req.body);
    const saved = await submission.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAllSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.find().populate("answers.taskId");
    res.status(200).json(submissions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.deleteAllSubmissions = async (req, res) => {
  try {
    const result = await Submission.deleteMany({});
    res.status(200).json({
      message: `${result.deletedCount} submission(s) deleted successfully.`,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
