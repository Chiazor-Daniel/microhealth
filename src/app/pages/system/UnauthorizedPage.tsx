import React from "react";
import { useNavigate } from "react-router";
import { Shield } from "lucide-react";

function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center min-h-dvh h-dvh bg-background" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <div className="text-center max-w-sm mx-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "#FEF2F2" }}>
          <Shield size={28} style={{ color: "#EF4444" }} />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-sm text-muted-foreground mb-6">You do not have permission to view this page. Contact your administrator if you believe this is an error.</p>
        <div className="flex gap-3 justify-center">
          <button className="px-4 py-2.5 text-sm font-medium rounded-lg border" style={{ color: "#374151", borderColor: "rgba(0,0,0,0.1)" }} onClick={() => navigate(-1 as never)}>← Go Back</button>
          <button className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }} onClick={() => navigate("/login")}>Sign In</button>
        </div>
      </div>
    </div>
  );
}

export default UnauthorizedPage;
