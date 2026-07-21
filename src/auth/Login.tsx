import { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FormData {
  email: string;
  password: string;
  remember: boolean;
}

interface FieldError {
  [key: string]: string;
}

export default function Login() {
  const [form, setForm] = useState<FormData>({ email: "", password: "", remember: false });
  const [errors, setErrors] = useState<FieldError>({});
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // Escape #root constraints same as Register page
  useEffect(() => {
    const root = document.getElementById("root");
    const body = document.body;
    const html = document.documentElement;
    if (!root) return;
    const prev = {
      cssText:      root.style.cssText,
      bodyOverflow: body.style.overflow,
      htmlOverflow: html.style.overflow,
    };
    root.style.cssText = "width:100%!important;max-width:100%!important;margin:0!important;border:none!important;min-height:100vh!important;overflow:hidden!important;display:block!important;text-align:left!important;";
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    return () => {
      root.style.cssText   = prev.cssText;
      body.style.overflow  = prev.bodyOverflow;
      html.style.overflow  = prev.htmlOverflow;
    };
  }, []);

  const set = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const e: FieldError = {};
    if (!form.email.trim())   e.email    = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password)       e.password = "Password is required";
    else if (form.password.length < 6) e.password = "Min. 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      // navigate to dashboard after successful login
      navigate("/");
    }
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
        padding: "40px 40px 36px",
        boxSizing: "border-box",
      }}>

        {/* ── Header ──────────────────────────────────────────────── */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 style={{
            margin: "0 0 10px", fontSize: 26, fontWeight: 800,
            color: "#0f172a", letterSpacing: "-0.4px",
          }}>
            System Login
          </h1>
          <p style={{ margin: 0, fontSize: 14, color: "#94a3b8", lineHeight: 1.6 }}>
            Access your educational dashboard and administrative tools.
          </p>
        </div>

        {/* ── Email ───────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", display: "block", marginBottom: 6 }}>
            Email Address
          </label>
          <div style={{ position: "relative" }}>
            <Mail size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="admin@edupulse.edu"
              style={{
                width: "100%", padding: "11px 14px 11px 38px",
                borderRadius: 9, fontSize: 14, color: "#0f172a", outline: "none",
                border: `1.5px solid ${errors.email ? "#ef4444" : "#e2e8f0"}`,
                background: "#f8fafc", boxSizing: "border-box",
              }}
            />
          </div>
          {errors.email
            ? <p style={{ margin: "5px 0 0", fontSize: 12, color: "#ef4444" }}>{errors.email}</p>
            : <p style={{ margin: "5px 0 0", fontSize: 12, color: "#94a3b8" }}>Enter your registered school email address.</p>
          }
        </div>

        {/* ── Password ────────────────────────────────────────────── */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <label style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>Password</label>
            <span onClick={() => navigate("/reset-password")}
  style={{ fontSize: 13, color: "#3b82f6", fontWeight: 600, cursor: "pointer" }}>
  Forgot password?
</span>
          </div>
          <div style={{ position: "relative" }}>
            <Lock size={15} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%", padding: "11px 40px 11px 38px",
                borderRadius: 9, fontSize: 14, color: "#0f172a", outline: "none",
                border: `1.5px solid ${errors.password ? "#ef4444" : "#e2e8f0"}`,
                background: "#f8fafc", boxSizing: "border-box",
              }}
            />
            <button
              onClick={() => setShowPassword((p) => !p)}
              style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }}>
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.password && <p style={{ margin: "5px 0 0", fontSize: 12, color: "#ef4444" }}>{errors.password}</p>}
        </div>

        {/* ── Remember me ─────────────────────────────────────────── */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={form.remember}
              onChange={(e) => set("remember", e.target.checked)}
              style={{ width: 15, height: 15, accentColor: "#3b82f6", cursor: "pointer", flexShrink: 0 }}
            />
            <span style={{ fontSize: 13.5, color: "#64748b" }}>Remember this device for 30 days</span>
          </label>
        </div>

        {/* ── Submit ──────────────────────────────────────────────── */}
        <button
          onClick={handleSubmit}
          style={{
            width: "100%", padding: "13px", borderRadius: 9, border: "none",
            background: "linear-gradient(135deg,#3b82f6,#2563eb)",
            color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            marginBottom: 20,
          }}>
          Sign In to Portal →
        </button>

        {/* ── Register link ───────────────────────────────────────── */}
        <p style={{ textAlign: "center", fontSize: 13.5, color: "#64748b", margin: 0 }}>
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            style={{ color: "#3b82f6", fontWeight: 700, cursor: "pointer" }}>
            Register your institution
          </span>
        </p>
      </div>
    </div>
  );
}