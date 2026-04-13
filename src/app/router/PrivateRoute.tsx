// @ts-nocheck
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth.context";
import Loader from "../../shared/ui/Loader";
import PageLayout from "../../shared/ui/PageLayout";

export default function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loader fullscreen text="Проверяем сессию" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return (
    <PageLayout>
      <Outlet />
    </PageLayout>
  );
}
