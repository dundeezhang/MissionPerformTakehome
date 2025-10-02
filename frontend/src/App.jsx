import React, { useState, useEffect } from "react";
import { RefreshCw, Plus, XCircle, LogOut } from "lucide-react";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/authUtils.jsx";
import AuthPage from "./components/auth/AuthPage";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import { useTaskFunctions } from "./hooks/task-functions";
import "./css/index.css";

// Main App Component (wrapped with auth)
const AppContent = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const {
    tasks,
    isTasksLoading,
    error,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    clearError,
    clearTasks,
  } = useTaskFunctions();

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  // Load tasks when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadTasks();
    }
  }, [isAuthenticated, loadTasks]);

  // Listen for auth logout events
  useEffect(() => {
    const handleAuthLogout = () => {
      clearTasks();
      setShowForm(false);
      setEditingTask(null);
    };

    window.addEventListener("auth:logout", handleAuthLogout);
    return () => window.removeEventListener("auth:logout", handleAuthLogout);
  }, [clearTasks]);

  // BACKEND CALL: POST /tasks - Create a new task
  const handleCreateTask = async (taskData) => {
    try {
      await createTask(taskData);
      setShowForm(false);
    } catch (error) {
      console.error("Failed to create task:", error);
      throw error; // Re-throw to handle in TaskForm
    }
  };

  // BACKEND CALL: PUT /tasks/:id - Update a task by ID
  const handleUpdateTask = async (taskData) => {
    try {
      await updateTask(editingTask._id || editingTask.id, taskData);
      setEditingTask(null);
      setShowForm(false);
    } catch (error) {
      console.error("Failed to update task:", error);
      throw error; // Re-throw to handle in TaskForm
    }
  };

  // BACKEND CALL: DELETE /tasks/:id - Delete a task by ID
  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(taskId);
    } catch (error) {
      console.error("Failed to delete task:", error);
      throw error; // Re-throw to handle in TaskItem
    }
  };

  // BACKEND CALL: PUT /tasks/:id - Update task status
  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await updateTaskStatus(taskId, newStatus);
    } catch (error) {
      console.error("Failed to update task status:", error);
      throw error; // Re-throw to handle in TaskItem
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setEditingTask(null);
    setShowForm(false);
  };

  const handleRefresh = () => {
    loadTasks();
  };

  const handleLogout = async () => {
    if (window.confirm("Are you sure you want to log out?")) {
      await logout();
    }
  };

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Show main app if authenticated
  return (
    <div className="app">
      <div className="app-container">
        {/* Header */}
        <header className="app-header">
          <div className="header-top-row">
            <div className="header-content">
              <h1 className="app-title">Task Manager</h1>
              <p className="app-subtitle">
                Welcome back, {user?.firstName || user?.username || "User"}!
              </p>
            </div>

            <div className="user-info">
              <div className="user-avatar">
                {(
                  user?.firstName?.[0] ||
                  user?.username?.[0] ||
                  "U"
                ).toUpperCase()}
              </div>
              <div className="user-details">
                <span className="user-name">
                  {user?.fullName || user?.username}
                </span>
                <span className="user-email">{user?.email}</span>
              </div>
            </div>
          </div>

          <div className="header-actions">
            <button
              className="btn btn-refresh"
              onClick={handleRefresh}
              disabled={isTasksLoading}
              title="Refresh tasks"
            >
              <RefreshCw size={20} />
            </button>

            <button
              className="btn btn-primary"
              onClick={() => setShowForm(!showForm)}
              disabled={isTasksLoading}
            >
              {showForm ? (
                "Cancel"
              ) : (
                <>
                  <Plus size={20} />
                  Add Task
                </>
              )}
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleLogout}
              title="Logout"
            >
              <LogOut size={20} />
              Logout
            </button>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div className="error-banner">
            <div className="error-content">
              <XCircle size={20} />
              <span>{error}</span>
            </div>
            <button className="error-close" onClick={clearError}>
              ×
            </button>
          </div>
        )}

        {/* Main Content */}
        <main className="app-main">
          {/* Task Form */}
          {showForm && (
            <section className="form-section">
              <TaskForm
                task={editingTask}
                onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
                onCancel={handleCancelForm}
                isEditing={!!editingTask}
              />
            </section>
          )}

          {/* Task List */}
          <section className="list-section">
            <TaskList
              tasks={tasks}
              onEdit={handleEditTask}
              onDelete={handleDeleteTask}
              onStatusChange={handleStatusChange}
              isLoading={isTasksLoading}
            />
          </section>
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <p>Built with React • Secured with JWT Authentication</p>
        </footer>
      </div>
    </div>
  );
};

// Root App Component with Auth Provider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
