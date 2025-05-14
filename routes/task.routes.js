const express = require("express");

const router = express.Router();
const taskController = require("../controllers/task.controller");
const csvToJson = require("../middleware/csvToJson");

// Routes brugt opgaveoprettelse (både batch og individuel), sletning og opdatering
router.get("/", taskController.getAllTasks);
router.get("/:id", taskController.getTaskById);
router.post("/", taskController.createTask);
router.post("/upload", csvToJson, taskController.uploadTasks);
router.patch("/:id", taskController.updateTask);
router.delete("/:id", taskController.deleteTask);
router.delete("/", taskController.deleteAllTasks);

module.exports = router;
