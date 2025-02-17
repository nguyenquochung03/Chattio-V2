import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ condition, redirectTo, children }) => {
  return condition ? children : <Navigate to={redirectTo} />;
};

export default ProtectedRoute;
