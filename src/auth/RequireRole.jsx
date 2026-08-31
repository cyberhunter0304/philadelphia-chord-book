import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthProvider";

export function RequireRole({ roles = ["user", "admin"], children }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }
  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  if (!roles.includes(role)) {
    return (
      <div className="mx-auto max-w-md p-10 text-center">
        <h2 className="text-lg font-semibold">Not authorized</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This area needs the <strong>{roles.join(" / ")}</strong> role. Ask an admin for access.
        </p>
      </div>
    );
  }
  return children;
}
