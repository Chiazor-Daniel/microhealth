import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { success } from "../../components/shared/SweetAlert";

const BTN_SHADOW = "0 4px 6px -1px rgba(15,125,122,0.3)";

function LoginPage() {
  const [email, setEmail] = useState("dr.okonkwo@microhealth.ng");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      success("Welcome back", "Signed in successfully");
      navigate("/admin/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh h-dvh w-full" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <div className="hidden lg:flex flex-col w-[480px] flex-shrink-0 p-10 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0A5E5C 0%, #0F7D7A 50%, #131E33 100%)" }}>
        <div className="flex items-center gap-3 mb-auto">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
            <Heart size={18} color="#fff" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">MicroHealth</span>
        </div>
        <div className="mb-auto">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">Smarter care,<br />one record at a time.</h2>
          <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            Unified clinical operations for modern healthcare facilities. Manage patients, schedules, vitals, and revenue from one secure platform.
          </p>
        </div>
        <div className="rounded-2xl p-5 mb-8" style={{ background: "rgba(255,255,255,0.10)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>Demo access</p>
          <div className="text-2xl font-bold text-white mt-2">Admin · Staff · Patient</div>
          <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>Use seeded accounts to explore every role.</p>
        </div>
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full" style={{ background: "rgba(255,255,255,0.03)" }} />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-all mb-4">
              ← Back to home
            </button>
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your staff portal</p>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1.5">Email address</label>
              <input className="w-full px-4 py-2.5 text-sm rounded-lg outline-none transition-all"
                style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)", color: "#111827" }}
                value={email} onChange={e => setEmail(e.target.value)} type="email" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-foreground">Password</label>
                <button type="button" className="text-xs font-medium" style={{ color: "#0F7D7A" }} onClick={() => navigate("/forgot-password")}>Forgot password?</button>
              </div>
              <input className="w-full px-4 py-2.5 text-sm rounded-lg outline-none transition-all"
                style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)", color: "#111827" }}
                value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Enter password" />
            </div>
            <button type="submit" className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all mt-2 flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #0F7D7A 0%, #0A5E5C 100%)", boxShadow: BTN_SHADOW }}
              disabled={loading}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              Sign In
            </button>
          </form>

          <div className="flex items-center gap-3 mt-6">
            <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
            <span className="text-xs text-muted-foreground">or quick access</span>
            <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
          </div>
          <button className="w-full py-2.5 mt-4 rounded-lg text-sm font-medium border transition-all"
            style={{ color: "#374151", borderColor: "rgba(0,0,0,0.1)", background: "#fff" }}
            onClick={() => navigate("/")}>
            ← Back to Landing Page
          </button>
          <button className="w-full py-2.5 mt-2 rounded-lg text-sm font-medium border transition-all"
            style={{ color: "#374151", borderColor: "rgba(0,0,0,0.1)", background: "#fff" }}
            onClick={() => navigate("/patient/login")}>
            View Patient Experience →
          </button>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
