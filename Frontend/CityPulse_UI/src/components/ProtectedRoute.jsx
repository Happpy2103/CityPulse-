// src/components/ProtectedRoute.jsx
import React from "react";
import { Navigate, useLocation } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const token = localStorage.getItem("token");
  const userRaw = localStorage.getItem("user");

  // If no token or no user saved => redirect to login
  if (!token || !userRaw) {
    // optional: clear stale items
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("roleId");
    localStorage.removeItem("lastLogin");

    // Redirect to /login and remember where user was trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
