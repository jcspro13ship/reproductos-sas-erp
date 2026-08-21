import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { sesion } = useAuth();
  if (!sesion) return <Navigate to="/panel/login" replace />;
  return children;
}
