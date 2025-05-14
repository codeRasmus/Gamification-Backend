const express = require("express");
const router = express.Router();
const submissionController = require("../controllers/submission.controller");

// Routes brugt ifm. indsendelse af opgavebesvarelser
// NB: getAll og deleteAll er ikke en del af programmet
router.post("/", submissionController.createSubmission);
router.get("/", submissionController.getAllSubmissions);
router.delete("/", submissionController.deleteAllSubmissions);

module.exports = router;
