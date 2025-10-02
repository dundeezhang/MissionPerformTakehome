import React, { useState } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Clipboard } from "lucide-react";
import TaskItem from "./TaskItem";

const TaskList = ({ tasks, onEdit, onDelete, onStatusChange, isLoading }) => {
  const [filter, setFilter] = useState("All");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const filterOptions = ["All", "To Do", "In Progress", "Done"];
  const sortOptions = [
    { value: "createdAt", label: "Date Created" },
    { value: "title", label: "Title" },
    { value: "status", label: "Status" },
  ];

  // Filter tasks based on selected filter
  const filteredTasks = tasks.filter((task) => {
    if (filter === "All") return true;
    return task.status === filter;
  });

  // Sort tasks based on selected criteria
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];

    // Handle date sorting
    if (sortBy === "createdAt") {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
    }

    // Handle string sorting (case-insensitive)
    if (typeof aValue === "string") {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }

    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getTaskCounts = () => {
    const counts = {
      total: tasks.length,
      todo: tasks.filter((task) => task.status === "To Do").length,
      inProgress: tasks.filter((task) => task.status === "In Progress").length,
      done: tasks.filter((task) => task.status === "Done").length,
    };
    return counts;
  };

  const taskCounts = getTaskCounts();

  if (isLoading) {
    return (
      <div className="task-list-loading">
        <div className="loading-spinner"></div>
        <p>Loading tasks...</p>
      </div>
    );
  }

  return (
    <div className="task-list-container">
      {/* Task Summary */}
      <div className="task-summary">
        <h2>Your Tasks</h2>
        <div className="task-stats">
          <div className="stat-item">
            <span className="stat-number">{taskCounts.total}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{taskCounts.todo}</span>
            <span className="stat-label">To Do</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{taskCounts.inProgress}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{taskCounts.done}</span>
            <span className="stat-label">Done</span>
          </div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="task-controls">
        <div className="filter-group">
          <label htmlFor="filter" className="control-label">
            Filter by Status:
          </label>
          <select
            id="filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="control-select"
          >
            {filterOptions.map((option) => {
              const getCount = (option) => {
                switch (option) {
                  case "To Do":
                    return taskCounts.todo;
                  case "In Progress":
                    return taskCounts.inProgress;
                  case "Done":
                    return taskCounts.done;
                  default:
                    return "";
                }
              };

              return (
                <option key={option} value={option}>
                  {option} {option !== "All" && `(${getCount(option)})`}
                </option>
              );
            })}
          </select>
        </div>

        <div className="sort-group">
          <div className="sort-select-group">
            <label htmlFor="sortBy" className="control-label">
              Sort by:
            </label>
            <select
              id="sortBy"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="control-select"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <button
            className={`sort-order-btn ${sortOrder}`}
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
          >
            {sortOrder === "asc" ? (
              <ArrowUp size={16} />
            ) : (
              <ArrowDown size={16} />
            )}
          </button>
        </div>
      </div>

      {/* Task List */}
      <div className="task-list">
        {sortedTasks.length === 0 ? (
          <div className="empty-state">
            {tasks.length === 0 ? (
              <div className="no-tasks">
                <Clipboard size={64} strokeWidth={1.5} />
                <h3>No tasks yet</h3>
                <p>Create your first task to get started!</p>
              </div>
            ) : (
              <div className="no-filtered-tasks">
                <h3>No tasks found</h3>
                <p>
                  No tasks match the current filter: <strong>{filter}</strong>
                </p>
                <button
                  className="btn btn-secondary"
                  onClick={() => setFilter("All")}
                >
                  Show All Tasks
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="task-items">
            {sortedTasks.map((task) => (
              <TaskItem
                key={task._id || task.id}
                task={task}
                onEdit={onEdit}
                onDelete={onDelete}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* Results Info */}
      {sortedTasks.length > 0 && (
        <div className="results-info">
          <p>
            Showing {sortedTasks.length} of {tasks.length} tasks
            {filter !== "All" && ` (filtered by ${filter})`}
          </p>
        </div>
      )}
    </div>
  );
};

export default TaskList;
