import React, { useState } from "react";
import { Clipboard } from "lucide-react";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";

const AuthPage = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);

  const switchToRegister = () => setIsLoginMode(false);
  const switchToLogin = () => setIsLoginMode(true);

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="auth-background-pattern"></div>
      </div>

      <div className="auth-content">
        <div className="auth-brand">
          <div className="brand-logo">
            <Clipboard size={40} strokeWidth={2} />
          </div>
          <h1 className="brand-title">Task Manager</h1>
          <p className="brand-subtitle">
            Organize your work, achieve your goals
          </p>
        </div>

        <div className="auth-forms">
          {isLoginMode ? (
            <LoginForm onSwitchToRegister={switchToRegister} />
          ) : (
            <RegisterForm onSwitchToLogin={switchToLogin} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
