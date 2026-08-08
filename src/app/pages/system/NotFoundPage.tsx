import React from "react";
import { useNavigate } from "react-router";
import { Info } from "lucide-react";

const BTN_SHADOW = "0 4px 6px -1px rgba(15,125,122,0.3)";

function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center min-h-dvh h-dvh bg-background" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <div className="text-center max-w-sm mx-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "#E6F7F6" }}>
          <Info size={28} style={{ color: "#0F7D7A" }} />
        </div>
        <h1 className="text-5xl font-bold text-foreground mb-3" style={{ color: "#0F7D7A" }}>404</h1>
        <p className="text-base font-semibold text-foreground mb-2">Page not found</p>
        <p className="text-sm text-muted-foreground mb-6">The page you are looking for does not exist or may have been moved.</p>
        <button className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: BTN_SHADOW }} onClick={() => navigate("/login")}>Back to Home</button>
      </div>
    </div>
  );
}

export default NotFoundPage;
