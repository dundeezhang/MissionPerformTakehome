const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const { authenticate } = require("../middleware/auth");

// Apply authentication middleware to all task routes
router.use(authenticate);

// GET /tasks - Retrieve all tasks for the authenticated user
router.get("/", async (req, res) => {
  try {
    // Only get tasks belonging to the authenticated user
    const tasks = await Task.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate("userId", "username email fullName");

    res.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch tasks",
      message: error.message,
    });
  }
});

// GET /tasks/:id - Retrieve a task by ID (only if owned by user)
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid task ID format",
      });
    }

    // Find task belonging to the authenticated user
    const task = await Task.findOne({
      _id: id,
      userId: req.user._id,
    }).populate("userId", "username email fullName");

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found or access denied",
      });
    }

    res.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch task",
      message: error.message,
    });
  }
});

// POST /tasks - Create a new task for the authenticated user
router.post("/", async (req, res) => {
  try {
    const { title, description, status } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: "Title is required",
      });
    }

    // Validate status if provided
    if (status && !["To Do", "In Progress", "Done"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be "To Do", "In Progress", or "Done"',
      });
    }

    const taskData = {
      userId: req.user._id, // Associate task with authenticated user
      title: title.trim(),
      description: description ? description.trim() : "",
      status: status || "To Do",
    };

    const task = new Task(taskData);
    const savedTask = await task.save();

    // Populate user info in response
    await savedTask.populate("userId", "username email fullName");

    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error creating task:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create task",
      message: error.message,
    });
  }
});

// PUT /tasks/:id - Update a task by ID (only if owned by user)
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid task ID format",
      });
    }

    // Validate required fields
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: "Title is required",
      });
    }

    // Validate status if provided
    if (status && !["To Do", "In Progress", "Done"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status must be "To Do", "In Progress", or "Done"',
      });
    }

    const updateData = {
      title: title.trim(),
      description: description ? description.trim() : "",
      status: status || "To Do",
      updatedAt: new Date(),
    };

    // Update only if task belongs to authenticated user
    const task = await Task.findOneAndUpdate(
      {
        _id: id,
        userId: req.user._id,
      },
      updateData,
      {
        new: true, // Return the updated document
        runValidators: true, // Run schema validators
      }
    ).populate("userId", "username email fullName");

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found or access denied",
      });
    }

    res.json(task);
  } catch (error) {
    console.error("Error updating task:", error);

    // Handle validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update task",
      message: error.message,
    });
  }
});

// DELETE /tasks/:id - Delete a task by ID (only if owned by user)
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        error: "Invalid task ID format",
      });
    }

    // Delete only if task belongs to authenticated user
    const task = await Task.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        error: "Task not found or access denied",
      });
    }

    res.json({
      success: true,
      message: "Task deleted successfully",
      deletedTask: task,
    });
  } catch (error) {
    console.error("Error deleting task:", error);
    res.status(500).json({
      success: false,
      error: "Failed to delete task",
      message: error.message,
    });
  }
});

module.exports = router;
