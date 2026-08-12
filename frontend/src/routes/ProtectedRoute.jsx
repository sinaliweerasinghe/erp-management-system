import { Navigate } from "react-router-dom";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  const isDemo = localStorage.getItem("demo");

  if (isDemo === "true" && !token) {
    return <Navigate to="/demo-dashboard" replace />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute; 
