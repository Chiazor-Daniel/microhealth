import React, { useState } from "react";
import { useNavigate } from "react-router";
import { Heart, Loader2 } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { success } from "../../components/shared/SweetAlert";

const CARD_SHADOW = "0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.10)";
const BTN_SHADOW = "0 4px 6px -1px rgba(15,125,122,0.3)";

function PatientLoginPage() {
  const [phone, setPhone] = useState("+234 803 456 7890");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { patientLogin } = useAuth();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await patientLogin(phone);
      success("Welcome back", "Signed in successfully");
      navigate("/patient/home");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-dvh h-dvh bg-background" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <div className="w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 justify-center mb-8">
          <button onClick={() => navigate("/")} className="absolute left-4 top-4 text-sm text-muted-foreground hover:text-foreground transition-all">← Back to home</button>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
            <Heart size={20} color="#fff" />
          </div>
          <span className="text-xl font-bold text-foreground">MicroHealth</span>
        </div>
        <div className="bg-card rounded-2xl p-6" style={{ boxShadow: CARD_SHADOW }}>
          <h2 className="text-xl font-bold text-foreground mb-1">Welcome back</h2>
          <p className="text-sm text-muted-foreground mb-6">Enter your phone number to sign in</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm text-red-700 bg-red-50 border border-red-200">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Phone Number</label>
            <div className="flex gap-2 mb-4">
              <span className="flex items-center px-3 text-sm font-medium rounded-lg" style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)" }}>🇳🇬</span>
              <input className="flex-1 px-3 py-2.5 text-sm rounded-lg outline-none"
                style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}
                value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <button type="submit" className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #0F7D7A 0%, #0A5E5C 100%)", boxShadow: BTN_SHADOW }}
              disabled={loading}>
              {loading && <Loader2 size={16} className="animate-spin" />}
              Sign In
            </button>
          </form>
        </div>
        <button className="w-full text-sm text-center text-muted-foreground hover:text-foreground transition-all mt-4" onClick={() => navigate("/login")}>Staff portal →</button>
        <button className="w-full text-sm text-center text-muted-foreground hover:text-foreground transition-all mt-2" onClick={() => navigate("/")}>← Back to home</button>
      </div>
    </div>
  );
}

export default PatientLoginPage;
