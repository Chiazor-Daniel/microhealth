import { useEffect } from "react";
import { useLocation, useNavigate, Outlet } from "react-router";
import { useAuth } from "../hooks/useAuth";
import { PatientShell } from "../patient/PatientShell";

export default function PatientLayout() {
  const navigate = useNavigate();
  const { loading, isAuthenticated, role } = useAuth();

  useEffect(() => {
    if (!loading && (!isAuthenticated || role !== "patient")) {
      navigate("/patient/login", { replace: true });
    }
  }, [loading, isAuthenticated, role, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center" style={{ background: "#F6FAF7" }}>
        <div
          className="h-8 w-8 rounded-full border-2 border-[#16A34A] border-t-transparent animate-spin"
        />
      </div>
    );
  }

  if (!isAuthenticated || role !== "patient") return null;

  return (
    <PatientShell>
      <Outlet />
    </PatientShell>
  );
}
