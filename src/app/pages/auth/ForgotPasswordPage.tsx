import React from "react";
import { useState } from "react";
import { useNavigate } from "react-router";
import { Heart, KeyRound, CheckCircle } from "lucide-react";

const CARD_SHADOW = "0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.10)";
const BTN_SHADOW = "0 4px 6px -1px rgba(15,125,122,0.3)";

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "sent" | "reset">("email");
  return (
    <div className="flex items-center justify-center min-h-dvh h-dvh bg-background" style={{ fontFamily: "'Work Sans', sans-serif" }}>
      <div className="w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
            <Heart size={20} color="#fff" />
          </div>
          <span className="text-xl font-bold text-foreground">MicroHealth</span>
        </div>
        <div className="bg-card rounded-2xl p-6" style={{ boxShadow: CARD_SHADOW }}>
          {step === "email" && (<>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#E6F7F6" }}><KeyRound size={20} style={{ color: "#0F7D7A" }} /></div>
            <h2 className="text-xl font-bold text-foreground mb-1">Reset Password</h2>
            <p className="text-sm text-muted-foreground mb-6">Enter your work email to receive a reset link.</p>
            <input className="w-full px-4 py-2.5 text-sm rounded-lg outline-none mb-4"
              style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}
              placeholder="dr.name@microhealth.ng" />
            <button className="w-full py-3 rounded-lg text-sm font-semibold text-white mb-3"
              style={{ background: "linear-gradient(135deg, #0F7D7A 0%, #0A5E5C 100%)", boxShadow: BTN_SHADOW }}
              onClick={() => setStep("sent")}>Send Reset Link</button>
            <button className="w-full text-sm text-center text-muted-foreground" onClick={() => navigate("/login")}>← Back to sign in</button>
          </>)}
          {step === "sent" && (<>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#ECFDF5" }}><CheckCircle size={20} style={{ color: "#10B981" }} /></div>
            <h2 className="text-xl font-bold text-foreground mb-1">Check your email</h2>
            <p className="text-sm text-muted-foreground mb-6">A reset link was sent to <strong>dr.okonkwo@microhealth.ng</strong>. It expires in 15 minutes.</p>
            <button className="w-full py-3 rounded-lg text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #0F7D7A 0%, #0A5E5C 100%)", boxShadow: BTN_SHADOW }}
              onClick={() => setStep("reset")}>I have the link →</button>
          </>)}
          {step === "reset" && (<>
            <h2 className="text-xl font-bold text-foreground mb-1">Set New Password</h2>
            <p className="text-sm text-muted-foreground mb-6">Must be at least 8 characters.</p>
            <div className="space-y-3 mb-4">
              <input className="w-full px-4 py-2.5 text-sm rounded-lg outline-none" placeholder="New password"
                style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }} type="password" />
              <input className="w-full px-4 py-2.5 text-sm rounded-lg outline-none" placeholder="Confirm password"
                style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }} type="password" />
            </div>
            <button className="w-full py-3 rounded-lg text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #0F7D7A 0%, #0A5E5C 100%)", boxShadow: BTN_SHADOW }}
              onClick={() => navigate("/login")}>Update Password</button>
          </>)}
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
