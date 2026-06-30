import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './auth-context';

export function ProtectedRoute() {
  const { user, loading, isDemo } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-sm font-semibold text-white">
        Verificando sessão...
      </main>
    );
  }

  if (!isDemo && !user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
