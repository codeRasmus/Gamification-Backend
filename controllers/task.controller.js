const Task = require("../models/task.model");

// Controller til at hente alle opgaver
exports.getAllTasks = async (req, res) => {
  const tasks = await Task.find();
  res.json(tasks);
};

// Controller til at hente en opgave baseret på ID
exports.getTaskById = async (req, res) => {
  const task = await Task.findById(req.params.id);
  res.json(task);
};

// Controller til at oprette en ny opgave
exports.createTask = async (req, res) => {
  const task = new Task(req.body);
  await task.save();
  res.status(201).json(task);
};

// Controller til at oprette ny opgavebank baseret på CSV -> JSON
exports.uploadTasks = async (req, res) => {
  try {
    const tasks = req.csvData;

    if (
      !Array.isArray(tasks) ||
      tasks.length === 0 ||
      typeof tasks[0] !== "object"
    ) {
      return res
        .status(400)
        .json({ message: "Dataene er ikke i korrekt format" });
    }

    // Insert tasks into the database
    const createdTasks = await Task.insertMany(tasks);

    res.status(201).json({
      message: "Tasks uploadet og gemt!",
      createdTasks,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Fejl ved upload af tasks",
      error: error.message,
    });
  }
};

// Controller til at opgave specifik opgave baseret på ID
exports.updateTask = async (req, res) => {
  const { id } = req.params; // Get the ID from the URL
  const updates = { ...req.body }; // Copy the request body to handle it more explicitly

  // Optional: Ensure that the ID is not in the request body
  delete updates._id;

  try {
    // Perform the update
    const task = await Task.findByIdAndUpdate(id, updates, {
      new: true, // Return the updated task
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task); // Send the updated task back
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating task" });
  }
};

// Controller til at slette en opgave baseret på ID
exports.deleteTask = async (req, res) => {
  await Task.findByIdAndDelete(req.params.id);
  res.status(204).send();
};

// Controller til at slette alle opgaver
exports.deleteAllTasks = async (req, res) => {
  try {
    await Task.deleteMany({});
    res.status(204).send(); // No content
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting all tasks" });
  }
};
