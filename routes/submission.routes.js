const express = require("express");
const router = express.Router();
const submissionController = require("../controllers/submission.controller");

router.post("/", submissionController.createSubmission);
router.get("/", submissionController.getAllSubmissions);
router.delete("/", submissionController.deleteAllSubmissions);

module.exports = router;
