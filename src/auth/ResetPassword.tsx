import { useState, useEffect } from "react";
import { Mail, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ResetPassword() {
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [submitted, setSubmitted] = useState(false);
  const navigate = useNavigate();

  // Escape #root constraints
  useEffect(() => {
    const root = document.getElementById("root");
    const body = document.body;
    const html = document.documentElement;
    if (!root) return;
    const prev = { cssText: root.style.cssText, bodyOverflow: body.style.overflow, htmlOverflow: html.style.overflow };
    root.style.cssText = "width:100%!important;max-width:100%!important;margin:0!important;border:none!important;min-height:100vh!important;overflow:hidden!important;display:block!important;text-align:left!important;";
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    return () => {
      root.style.cssText  = prev.cssText;
      body.style.overflow = prev.bodyOverflow;
      html.style.overflow = prev.htmlOverflow;
    };
  }, []);

  const handleSubmit = () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Enter a valid email address");
      return;
    }
    setError("");
    setSubmitted(true);
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#f1f5f9",
      fontFamily: "'Inter','Segoe UI',sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "16px", boxSizing: "border-box",
    }}>
      <div style={{
        width: "100%", maxWidth: 460,
        background: "#fff", borderRadius: 16,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        padding: "44px 40px 36px",
        boxSizing: "border-box",
      }}>

        {!submitted ? (
          <>
            {/* ── Header ────────────────────────────────────────── */}
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <h1 style={{ margin: "0 0 12px", fontSize: 26, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.4px" }}>
                Reset Password
              </h1>
              <p style={{ margin: 0, fontSize: 14, color: "#94a3b8", lineHeight: 1.7 }}>
                Enter your registered email address and we'll send you<br />
                a secure link to reset your account credentials.
              </p>
            </div>

            {/* ── Email ─────────────────────────────────────────── */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", display: "block", marginBottom: 7 }}>
                Institutional Email Address
              </label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  placeholder="principal@evergreenschool.edu"
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  style={{
                    width: "100%", padding: "11px 14px 11px 38px",
                    borderRadius: 9, fontSize: 14, color: "#0f172a", outline: "none",
                    border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
                    background: "#f8fafc", boxSizing: "border-box",
                  }}
                />
              </div>
              {error && <p style={{ margin: "5px 0 0", fontSize: 12, color: "#ef4444" }}>{error}</p>}
            </div>

            {/* ── Submit ────────────────────────────────────────── */}
            <button
              onClick={handleSubmit}
              style={{
                width: "100%", padding: "13px", borderRadius: 9, border: "none",
                background: "linear-gradient(135deg,#4f46e5,#6366f1)",
                color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                marginBottom: 24,
              }}>
              Send Reset Link →
            </button>

            {/* ── Divider ───────────────────────────────────────── */}
            <div style={{ height: 1, background: "#f1f5f9", marginBottom: 20 }} />

            {/* ── Back to Login ─────────────────────────────────── */}
            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => navigate("/login")}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "#3b82f6", fontSize: 14, fontWeight: 600,
                  display: "inline-flex", alignItems: "center", gap: 5,
                }}>
                <ChevronLeft size={16} /> Back to Login
              </button>
            </div>
          </>
        ) : (
          /* ── Success state ──────────────────────────────────── */
          <div style={{ textAlign: "center" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: "#f0fdf4", display: "flex", alignItems: "center",
              justifyContent: "center", margin: "0 auto 20px", fontSize: 26,
            }}>
              ✅
            </div>
            <h1 style={{ margin: "0 0 10px", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>
              Check your email
            </h1>
            <p style={{ margin: "0 0 28px", fontSize: 14, color: "#94a3b8", lineHeight: 1.7 }}>
              We've sent a password reset link to<br />
              <strong style={{ color: "#0f172a" }}>{email}</strong>.<br />
              It will expire in 30 minutes.
            </p>
            <div style={{ height: 1, background: "#f1f5f9", marginBottom: 20 }} />
            <button
              onClick={() => navigate("/login")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                color: "#3b82f6", fontSize: 14, fontWeight: 600,
                display: "inline-flex", alignItems: "center", gap: 5,
              }}>
              <ChevronLeft size={16} /> Back to Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}