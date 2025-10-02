import { useState, useCallback } from "react";
import { taskAPI } from "../services/api";

// Custom hook for task management functions
export const useTaskFunctions = () => {
  const [tasks, setTasks] = useState([]);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [error, setError] = useState(null);

  // BACKEND CALL: GET /tasks - Retrieve all tasks for authenticated user
  const loadTasks = useCallback(async () => {
    try {
      setIsTasksLoading(true);
      setError(null);
      const tasksData = await taskAPI.getAllTasks();
      setTasks(tasksData);
      return tasksData;
    } catch (error) {
      console.error("Failed to load tasks:", error);

      if (error.response?.status === 401) {
        // Authentication error, will be handled by interceptor
        return;
      }

      const errorMessage =
        "Failed to load tasks. Please check if the backend server is running.";
      setError(errorMessage);
      throw error;
    } finally {
      setIsTasksLoading(false);
    }
  }, []);

  // BACKEND CALL: POST /tasks - Create a new task
  const createTask = useCallback(async (taskData) => {
    try {
      const newTask = await taskAPI.createTask({
        ...taskData,
        createdAt: new Date().toISOString(),
      });

      // Add new task to the beginning of the list
      setTasks((prevTasks) => [newTask, ...prevTasks]);
      setError(null);
      return newTask;
    } catch (error) {
      console.error("Failed to create task:", error);
      throw error; // Re-throw to handle in TaskForm
    }
  }, []);

  // BACKEND CALL: PUT /tasks/:id - Update a task by ID
  const updateTask = useCallback(async (taskId, taskData) => {
    try {
      const updatedTask = await taskAPI.updateTask(taskId, {
        ...taskData,
        updatedAt: new Date().toISOString(),
      });

      // Update task in the list
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          (task._id || task.id) === taskId ? { ...task, ...updatedTask } : task
        )
      );

      setError(null);
      return updatedTask;
    } catch (error) {
      console.error("Failed to update task:", error);
      throw error; // Re-throw to handle in TaskForm
    }
  }, []);

  // BACKEND CALL: DELETE /tasks/:id - Delete a task by ID
  const deleteTask = useCallback(async (taskId) => {
    try {
      await taskAPI.deleteTask(taskId);

      // Remove task from the list
      setTasks((prevTasks) =>
        prevTasks.filter((task) => (task._id || task.id) !== taskId)
      );
      setError(null);
    } catch (error) {
      console.error("Failed to delete task:", error);
      throw error; // Re-throw to handle in TaskItem
    }
  }, []);

  // BACKEND CALL: PUT /tasks/:id - Update task status
  const updateTaskStatus = useCallback(
    async (taskId, newStatus) => {
      try {
        // Find the current task to get its current data
        const currentTask = tasks.find(
          (task) => (task._id || task.id) === taskId
        );

        if (!currentTask) {
          throw new Error("Task not found in current tasks list");
        }

        // Send the complete task data with updated status
        // This fixes the 400 error by including required fields like title
        const updatedTask = await taskAPI.updateTask(taskId, {
          title: currentTask.title,
          description: currentTask.description || "",
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });

        // Update task status in the list
        setTasks((prevTasks) =>
          prevTasks.map((task) =>
            (task._id || task.id) === taskId
              ? { ...task, status: newStatus, updatedAt: updatedTask.updatedAt }
              : task
          )
        );
        setError(null);
        return updatedTask;
      } catch (error) {
        console.error("Failed to update task status:", error);
        throw error; // Re-throw to handle in TaskItem
      }
    },
    [tasks]
  );

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear tasks function (useful for logout)
  const clearTasks = useCallback(() => {
    setTasks([]);
    setError(null);
  }, []);

  return {
    // State
    tasks,
    isTasksLoading,
    error,

    // Actions
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    clearError,
    clearTasks,
    setTasks,
  };
};
