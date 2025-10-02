import React, { useState } from "react";
import { Edit2, Trash2 } from "lucide-react";

const TaskItem = ({ task, onEdit, onDelete, onStatusChange }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const getStatusColor = (status) => {
    switch (status) {
      case "To Do":
        return "status-todo";
      case "In Progress":
        return "status-progress";
      case "Done":
        return "status-done";
      default:
        return "status-todo";
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      setIsDeleting(true);
      try {
        await onDelete(task._id || task.id);
      } catch (error) {
        console.error("Error deleting task:", error);
        alert("Failed to delete task. Please try again.");
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      await onStatusChange(task._id || task.id, newStatus);
    } catch (error) {
      console.error("Error updating task status:", error);
      alert("Failed to update task status. Please try again.");
    }
  };

  const truncateText = (text, maxLength = 100) => {
    if (!text) return "";
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className={`task-item ${isDeleting ? "deleting" : ""}`}>
      <div className="task-header">
        <div className="task-main-info">
          <h3 className="task-title">{task.title}</h3>
          <div className="task-meta">
            <span className={`task-status ${getStatusColor(task.status)}`}>
              {task.status}
            </span>
            <span className="task-date">
              Created: {formatDate(task.createdAt)}
            </span>
          </div>
        </div>

        <div className="task-actions">
          <select
            value={task.status}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="status-dropdown"
            disabled={isDeleting}
          >
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>

          <button
            className="btn btn-edit"
            onClick={() => onEdit(task)}
            disabled={isDeleting}
            title="Edit task"
          >
            <Edit2 size={16} />
          </button>

          <button
            className="btn btn-delete"
            onClick={handleDelete}
            disabled={isDeleting}
            title="Delete task"
          >
            {isDeleting ? (
              <div className="spinner"></div>
            ) : (
              <Trash2 size={16} />
            )}
          </button>
        </div>
      </div>

      {task.description && (
        <div className="task-description">
          <p className={isExpanded ? "expanded" : "collapsed"}>
            {isExpanded ? task.description : truncateText(task.description)}
          </p>
          {task.description.length > 100 && (
            <button
              className="btn btn-link expand-btn"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {task.updatedAt && task.updatedAt !== task.createdAt && (
        <div className="task-updated">
          <small>Last updated: {formatDate(task.updatedAt)}</small>
        </div>
      )}
    </div>
  );
};

export default TaskItem;
