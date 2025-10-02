import React, { useState, useEffect } from "react";
import { RefreshCw, Plus, LogOut, XCircle } from "lucide-react";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/authUtils.jsx";
import AuthPage from "./components/auth/AuthPage";
import TaskForm from "./components/TaskForm";
import TaskList from "./components/TaskList";
import { useTaskFunctions } from "./hooks/task-functions";
import "./App.css";

// Main App Component (wrapped with auth)
const AppContent = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const {
    tasks,
    isTasksLoading,
    error,
    setError,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
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

  // BACKEND CALL HANDLERS: These functions handle form submissions and UI state
  const handleCreateTask = async (taskData) => {
    await createTask(taskData);
    setShowForm(false);
  };

  const handleUpdateTask = async (taskData) => {
    await updateTask(editingTask._id || editingTask.id, taskData);
    setEditingTask(null);
    setShowForm(false);
  };

  const handleDeleteTask = async (taskId) => {
    await deleteTask(taskId);
  };

  const handleStatusChange = async (taskId, newStatus) => {
    await updateTaskStatus(taskId, newStatus);
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
          {/* Top row: Title/Welcome on left, User info on right */}
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

          {/* Bottom row: Action buttons on left */}
          <div className="header-actions">
            <button
              className={`btn btn-refresh ${isTasksLoading ? "loading" : ""}`}
              onClick={handleRefresh}
              disabled={isTasksLoading}
              title={isTasksLoading ? "Refreshing tasks..." : "Refresh tasks"}
            >
              <RefreshCw
                size={20}
                className={isTasksLoading ? "spinning" : ""}
              />
              Refresh
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
            <button className="error-close" onClick={() => setError(null)}>
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
          <p className="api-info">
            <strong>Your Tasks:</strong> {tasks.length} total
            {tasks.length > 0 && (
              <>
                <span className="task-stats">
                  • {tasks.filter((t) => t.status === "To Do").length} pending •{" "}
                  {tasks.filter((t) => t.status === "In Progress").length} in
                  progress • {tasks.filter((t) => t.status === "Done").length}{" "}
                  completed
                </span>
              </>
            )}
          </p>
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
