import axios from "axios";

// Base URL for the backend API - use environment variable or fallback to localhost
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5001/api";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds timeout
});

// Storage utilities for tokens
const getAccessToken = () => localStorage.getItem("taskManager_accessToken");
const getRefreshToken = () => localStorage.getItem("taskManager_refreshToken");
const setTokens = (tokens) => {
  localStorage.setItem("taskManager_accessToken", tokens.accessToken);
  localStorage.setItem("taskManager_refreshToken", tokens.refreshToken);
};
const clearTokens = () => {
  localStorage.removeItem("taskManager_accessToken");
  localStorage.removeItem("taskManager_refreshToken");
  localStorage.removeItem("taskManager_user");
};

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling token refresh and errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = getRefreshToken();

      if (refreshToken && error.response?.data?.code === "TOKEN_EXPIRED") {
        try {
          // Try to refresh the token
          const refreshResponse = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {
              refreshToken,
            }
          );

          const { tokens } = refreshResponse.data;
          setTokens(tokens);

          // Update the authorization header and retry the original request
          originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          clearTokens();

          // Redirect to login page or trigger logout
          window.dispatchEvent(new CustomEvent("auth:logout"));
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token or refresh failed, clear tokens and logout
        clearTokens();
        window.dispatchEvent(new CustomEvent("auth:logout"));
      }
    }

    // Handle other errors
    if (error.response) {
      console.error("API Error:", error.response.data);
    } else if (error.request) {
      console.error("Network Error:", error.request);
    } else {
      console.error("Error:", error.message);
    }

    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  // POST /auth/register - User registration
  register: async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      return response.data;
    } catch (error) {
      console.error("Error registering user:", error);
      throw error;
    }
  },

  // POST /auth/login - User login
  login: async (credentials) => {
    try {
      const response = await api.post("/auth/login", credentials);
      return response.data;
    } catch (error) {
      console.error("Error logging in:", error);
      throw error;
    }
  },

  // POST /auth/logout - User logout
  logout: async () => {
    try {
      const response = await api.post("/auth/logout");
      return response.data;
    } catch (error) {
      console.error("Error logging out:", error);
      throw error;
    }
  },

  // POST /auth/logout-all - Logout from all devices
  logoutAll: async () => {
    try {
      const response = await api.post("/auth/logout-all");
      return response.data;
    } catch (error) {
      console.error("Error logging out from all devices:", error);
      throw error;
    }
  },

  // POST /auth/refresh - Refresh access token
  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post("/auth/refresh", { refreshToken });
      return response.data;
    } catch (error) {
      console.error("Error refreshing token:", error);
      throw error;
    }
  },

  // GET /auth/me - Get current user profile
  getProfile: async () => {
    try {
      const response = await api.get("/auth/me");
      return response.data;
    } catch (error) {
      console.error("Error getting user profile:", error);
      throw error;
    }
  },

  // GET /auth/sessions - Get active sessions
  getSessions: async () => {
    try {
      const response = await api.get("/auth/sessions");
      return response.data;
    } catch (error) {
      console.error("Error getting sessions:", error);
      throw error;
    }
  },

  // DELETE /auth/sessions/:sessionId - Revoke specific session
  revokeSession: async (sessionId) => {
    try {
      const response = await api.delete(`/auth/sessions/${sessionId}`);
      return response.data;
    } catch (error) {
      console.error(`Error revoking session ${sessionId}:`, error);
      throw error;
    }
  },

  // PUT /auth/change-password - Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.put("/auth/change-password", passwordData);
      return response.data;
    } catch (error) {
      console.error("Error changing password:", error);
      throw error;
    }
  },
};

// Task API service functions (now with authentication)
export const taskAPI = {
  // GET /tasks - Retrieve all tasks for authenticated user
  getAllTasks: async () => {
    try {
      const response = await api.get("/tasks");
      return response.data;
    } catch (error) {
      console.error("Error fetching tasks:", error);
      throw error;
    }
  },

  // GET /tasks/:id - Retrieve a task by ID (user's task only)
  getTaskById: async (taskId) => {
    try {
      const response = await api.get(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching task ${taskId}:`, error);
      throw error;
    }
  },

  // POST /tasks - Create a new task for authenticated user
  createTask: async (taskData) => {
    try {
      const response = await api.post("/tasks", taskData);
      return response.data;
    } catch (error) {
      console.error("Error creating task:", error);
      throw error;
    }
  },

  // PUT /tasks/:id - Update a task by ID (user's task only)
  updateTask: async (taskId, taskData) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, taskData);
      return response.data;
    } catch (error) {
      console.error(`Error updating task ${taskId}:`, error);
      throw error;
    }
  },

  // DELETE /tasks/:id - Delete a task by ID (user's task only)
  deleteTask: async (taskId) => {
    try {
      const response = await api.delete(`/tasks/${taskId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting task ${taskId}:`, error);
      throw error;
    }
  },
};

// Export the configured axios instance for custom use
export default api;
