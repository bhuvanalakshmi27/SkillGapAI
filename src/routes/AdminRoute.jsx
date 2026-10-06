import { Navigate, Outlet } from "react-router-dom";
import ProtectedRoute from "./ProtectedRoute";

function AdminRoute() {
  const role = localStorage.getItem("userRole");

  if (role !== "admin") {
    return <Navigate to="/overview" replace />;
  }

  return <Outlet />;
}

export function AdminProtectedLayout() {
  return (
    <ProtectedRoute>
      <AdminRoute />
    </ProtectedRoute>
  );
}

export default AdminRoute;
