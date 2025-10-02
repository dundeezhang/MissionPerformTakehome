import React, { createContext, useReducer, useEffect } from "react";

// Auth Context
const AuthContext = createContext();

// Auth state and actions
const initialState = {
  user: null,
  tokens: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// Auth actions
const AUTH_ACTIONS = {
  LOGIN_START: "LOGIN_START",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  LOGOUT: "LOGOUT",
  TOKEN_REFRESH: "TOKEN_REFRESH",
  SET_USER: "SET_USER",
  SET_LOADING: "SET_LOADING",
  CLEAR_ERROR: "CLEAR_ERROR",
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        tokens: action.payload.tokens,
        session: action.payload.session,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        tokens: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload.error,
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        tokens: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case AUTH_ACTIONS.TOKEN_REFRESH:
      return {
        ...state,
        tokens: action.payload.tokens,
        error: null,
      };

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload.user,
        session: action.payload.session,
        isLoading: false,
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };

    default:
      return state;
  }
};

// Storage utilities
const STORAGE_KEYS = {
  ACCESS_TOKEN: "taskManager_accessToken",
  REFRESH_TOKEN: "taskManager_refreshToken",
  USER: "taskManager_user",
};

const storage = {
  getAccessToken: () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN),
  getRefreshToken: () => localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN),
  getUser: () => {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  },
  setTokens: (tokens) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, tokens.accessToken);
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
  },
  setUser: (user) => {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  },
  clear: () => {
    localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
  },
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = storage.getAccessToken();
        const refreshToken = storage.getRefreshToken();
        const storedUser = storage.getUser();

        if (accessToken && refreshToken && storedUser) {
          // Verify tokens by fetching user profile
          try {
            const response = await fetch("http://localhost:5001/api/auth/me", {
              headers: {
                Authorization: `Bearer ${accessToken}`,
                "Content-Type": "application/json",
              },
            });

            if (response.ok) {
              const data = await response.json();
              dispatch({
                type: AUTH_ACTIONS.LOGIN_SUCCESS,
                payload: {
                  user: data.user,
                  session: data.session,
                  tokens: { accessToken, refreshToken },
                },
              });
            } else {
              // Token might be expired, try to refresh
              await refreshTokens();
            }
          } catch (error) {
            console.error("Failed to verify tokens:", error);
            storage.clear();
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          }
        } else {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        storage.clear();
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await fetch("http://localhost:5001/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens and user data
        storage.setTokens(data.tokens);
        storage.setUser(data.user);

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: data.user,
            tokens: data.tokens,
            session: data.session,
          },
        });

        return { success: true, data };
      } else {
        throw new Error(data.error || "Login failed");
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: error.message },
      });
      return { success: false, error: error.message };
    }
  };

  // Register function
  const register = async (userData) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await fetch("http://localhost:5001/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok) {
        // Store tokens and user data
        storage.setTokens(data.tokens);
        storage.setUser(data.user);

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: {
            user: data.user,
            tokens: data.tokens,
            session: data.session,
          },
        });

        return { success: true, data };
      } else {
        throw new Error(data.error || "Registration failed");
      }
    } catch (error) {
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: { error: error.message },
      });
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = async (logoutFromAll = false) => {
    try {
      const accessToken = storage.getAccessToken();

      if (accessToken) {
        const endpoint = logoutFromAll
          ? "/api/auth/logout-all"
          : "/api/auth/logout";

        await fetch(`http://localhost:5001${endpoint}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local storage and state regardless of API call success
      storage.clear();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    }
  };

  // Refresh tokens function
  const refreshTokens = async () => {
    try {
      const refreshToken = storage.getRefreshToken();

      if (!refreshToken) {
        throw new Error("No refresh token available");
      }

      const response = await fetch("http://localhost:5001/api/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });

      const data = await response.json();

      if (response.ok) {
        storage.setTokens(data.tokens);

        dispatch({
          type: AUTH_ACTIONS.TOKEN_REFRESH,
          payload: { tokens: data.tokens },
        });

        return data.tokens;
      } else {
        throw new Error(data.error || "Token refresh failed");
      }
    } catch (error) {
      console.error("Token refresh error:", error);
      storage.clear();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      throw error;
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    try {
      const user = { ...state.user, ...updates };
      storage.setUser(user);

      dispatch({
        type: AUTH_ACTIONS.SET_USER,
        payload: { user, session: state.session },
      });

      return { success: true };
    } catch (error) {
      console.error("Update profile error:", error);
      return { success: false, error: error.message };
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  // Check if user has permission
  const hasPermission = (permission) => {
    if (!state.isAuthenticated || !state.user) return false;

    // Basic permission checking (can be enhanced)
    if (permission === "admin") {
      return state.user.role === "admin";
    }

    return true; // Default: authenticated users have basic permissions
  };

  // Get authentication header
  const getAuthHeader = () => {
    const token = storage.getAccessToken();
    return token ? `Bearer ${token}` : null;
  };

  const value = {
    // State
    ...state,

    // Actions
    login,
    register,
    logout,
    refreshTokens,
    updateProfile,
    clearError,

    // Utilities
    hasPermission,
    getAuthHeader,

    // Storage access
    storage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
