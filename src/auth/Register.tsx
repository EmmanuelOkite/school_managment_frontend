import { useState, useEffect } from "react";
import {
  GraduationCap, User, Mail, Lock, Eye, EyeOff,
  ChevronDown, CheckCircle2, UserCheck, Users, UserCog,
} from "lucide-react";

interface FormData {
  role: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

interface FieldError {
  [key: string]: string;
}

const ROLE_OPTIONS = [
  { value: "Student",       icon: <GraduationCap size={14} color="#4f46e5" /> },
  { value: "Teacher",       icon: <UserCheck size={14} color="#4f46e5" /> },
  { value: "Parent",        icon: <Users size={14} color="#4f46e5" /> },
  { value: "Administrator", icon: <UserCog size={14} color="#4f46e5" /> },
];

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "#e2e8f0" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [
    { score: 1, label: "WEAK",   color: "#ef4444" },
    { score: 2, label: "FAIR",   color: "#f59e0b" },
    { score: 3, label: "GOOD",   color: "#f59e0b" },
    { score: 4, label: "STRONG", color: "#10b981" },
  ];
  return levels[score - 1] ?? { score: 0, label: "", color: "#e2e8f0" };
}

export default function Register() {
  const [form, setForm] = useState<FormData>({
    role: "Student", firstName: "", lastName: "",
    email: "", password: "", confirmPassword: "", agreeTerms: false,
  });
  const [errors, setErrors]             = useState<FieldError>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm,  setShowConfirm]  = useState(false);
  const [roleOpen,     setRoleOpen]     = useState(false);

  useEffect(() => {
    const root = document.getElementById("root");
    const body = document.body;
    const html = document.documentElement;
    if (!root) return;

    const prevStyles = {
      rootWidth:     root.style.width,
      rootMaxWidth:  root.style.maxWidth,
      rootMargin:    root.style.margin,
      rootBorder:    root.style.border,
      rootMinHeight: root.style.minHeight,
      rootOverflow:  root.style.overflow,
      rootDisplay:   root.style.display,
      rootTextAlign: root.style.textAlign,
      bodyOverflow:  body.style.overflow,
      htmlOverflow:  html.style.overflow,
    };

    root.style.cssText = "width:100%!important;max-width:100%!important;margin:0!important;border:none!important;min-height:100vh!important;overflow:hidden!important;display:block!important;text-align:left!important;";
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";

    return () => {
      root.style.width     = prevStyles.rootWidth;
      root.style.maxWidth  = prevStyles.rootMaxWidth;
      root.style.margin    = prevStyles.rootMargin;
      root.style.border    = prevStyles.rootBorder;
      root.style.minHeight = prevStyles.rootMinHeight;
      root.style.overflow  = prevStyles.rootOverflow;
      root.style.display   = prevStyles.rootDisplay;
      root.style.textAlign = prevStyles.rootTextAlign;
      body.style.overflow  = prevStyles.bodyOverflow;
      html.style.overflow  = prevStyles.htmlOverflow;
    };
  }, []);

  const set = (field: keyof FormData, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const e: FieldError = {};
    if (!form.firstName.trim()) e.firstName = "Required";
    if (!form.lastName.trim())  e.lastName  = "Required";
    if (!form.email.trim())     e.email     = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password)                e.password        = "Required";
    else if (form.password.length < 8) e.password        = "Min. 8 characters";
    if (!form.confirmPassword)         e.confirmPassword = "Required";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    if (!form.agreeTerms) e.agreeTerms = "You must agree to the terms";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => { if (validate()) alert("Registration submitted!"); };
  const strength     = getPasswordStrength(form.password);
  const selectedRole = ROLE_OPTIONS.find((r) => r.value === form.role);

  const inp = (err: boolean, greenOnFill = false, filled = false): React.CSSProperties => ({
    width: "100%", padding: "8px 12px 8px 30px", borderRadius: 7,
    fontSize: 13, outline: "none", color: "#0f172a", boxSizing: "border-box",
    border: `1.5px solid ${err ? "#ef4444" : (greenOnFill && filled) ? "#10b981" : "#e2e8f0"}`,
  });

  const ico: React.CSSProperties = {
    position: "absolute", left: 9, top: "50%", transform: "translateY(-50%)", color: "#94a3b8",
  };

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "#fafafa",
      fontFamily: "'Inter','Segoe UI',sans-serif",
      overflowY: "auto",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      padding: "20px 16px", boxSizing: "border-box",
    }}>

      {/* Logo */}
      <div style={{ textAlign: "center", marginBottom: 12, flexShrink: 0 }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%",
          background: "linear-gradient(135deg,#4f46e5,#6366f1)",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px",
        }}>
          <GraduationCap size={22} color="#fff" />
        </div>
        <p style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#4f46e5" }}>EduPulse</p>
        <h1 style={{ margin: "5px 0 3px", fontSize: 21, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.3px" }}>
          Join the Institution
        </h1>
        <p style={{ margin: 0, fontSize: 12.5, color: "#64748b" }}>
          Create your EduPulse account to access classrooms, grades, and campus resources.
        </p>
      </div>

      {/* Card */}
      <div style={{
        width: "100%", maxWidth: 420,
        background: "#fff", borderRadius: 14,
        border: "1px solid #e2e8f0",
        boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
        padding: "18px 22px",
        boxSizing: "border-box", flexShrink: 0,
      }}>
        <p style={{ margin: "0 0 2px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>Academic Registration</p>
        <p style={{ margin: "0 0 12px", fontSize: 12, color: "#94a3b8" }}>Enter your institutional details to set up your profile.</p>

        {/* Role */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#334155", display: "block", marginBottom: 4 }}>I am registering as...</label>
          <div style={{ position: "relative" }}>
            <button onClick={() => setRoleOpen((p) => !p)} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "8px 11px", borderRadius: 7, border: "1.5px solid #e2e8f0",
              background: "#fff", cursor: "pointer", fontSize: 13, color: "#0f172a", boxSizing: "border-box",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>{selectedRole?.icon} {form.role}</span>
              <ChevronDown size={13} color="#94a3b8" />
            </button>
            {roleOpen && (
              <div style={{
                position: "absolute", top: "calc(100% + 3px)", left: 0, right: 0, zIndex: 99,
                background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 7,
                boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
              }}>
                {ROLE_OPTIONS.map((r) => (
                  <div key={r.value} onClick={() => { set("role", r.value); setRoleOpen(false); }} style={{
                    padding: "9px 11px", cursor: "pointer", fontSize: 13,
                    color: form.role === r.value ? "#4f46e5" : "#334155",
                    background: form.role === r.value ? "#eef2ff" : "transparent",
                    fontWeight: form.role === r.value ? 600 : 400,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>{r.icon} {r.value}</div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Name */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
          {(["firstName", "lastName"] as const).map((field) => (
            <div key={field}>
              <label style={{ fontSize: 12, fontWeight: 500, color: "#334155", display: "block", marginBottom: 3 }}>
                {field === "firstName" ? "First Name" : "Last Name"}
              </label>
              <div style={{ position: "relative" }}>
                <User size={12} style={ico} />
                <input value={form[field]} onChange={(e) => set(field, e.target.value)}
                  placeholder={field === "firstName" ? "Jane" : "Doe"}
                  style={inp(!!errors[field], true, !!form[field])} />
                {form[field] && !errors[field] && (
                  <CheckCircle2 size={12} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", color: "#10b981" }} />
                )}
              </div>
              {errors[field] && <p style={{ margin: "2px 0 0", fontSize: 10.5, color: "#ef4444" }}>{errors[field]}</p>}
            </div>
          ))}
        </div>

        {/* Email */}
        <div style={{ marginBottom: 10 }}>
          <label style={{ fontSize: 12, fontWeight: 500, color: "#334155", display: "block", marginBottom: 3 }}>Email Address</label>
          <div style={{ position: "relative" }}>
            <Mail size={12} style={ico} />
            <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
              placeholder="jane.doe@company.com" style={inp(!!errors.email)} />
          </div>
          {errors.email && <p style={{ margin: "2px 0 0", fontSize: 10.5, color: "#ef4444" }}>{errors.email}</p>}
        </div>

        {/* Password */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#334155" }}>Password</label>
            <button onClick={() => setShowPassword(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }}>
              {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <div style={{ position: "relative" }}>
            <Lock size={12} style={ico} />
            <input type={showPassword ? "text" : "password"} value={form.password}
              onChange={(e) => set("password", e.target.value)} placeholder="••••••••" style={inp(!!errors.password)} />
          </div>
          {form.password.length > 0 && (
            <div style={{ marginTop: 5 }}>
              <div style={{ display: "flex", gap: 3, marginBottom: 2 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: i <= strength.score ? strength.color : "#e2e8f0" }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: strength.color }}>{strength.label}</span>
                <span style={{ fontSize: 10, color: "#94a3b8" }}>Min. 8 characters</span>
              </div>
            </div>
          )}
          {errors.password && <p style={{ margin: "2px 0 0", fontSize: 10.5, color: "#ef4444" }}>{errors.password}</p>}
        </div>

        {/* Confirm */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
            <label style={{ fontSize: 12, fontWeight: 500, color: "#334155" }}>Confirm Password</label>
            <button onClick={() => setShowConfirm(p => !p)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0, display: "flex" }}>
              {showConfirm ? <EyeOff size={13} /> : <Eye size={13} />}
            </button>
          </div>
          <div style={{ position: "relative" }}>
            <Lock size={12} style={ico} />
            <input type={showConfirm ? "text" : "password"} value={form.confirmPassword}
              onChange={(e) => set("confirmPassword", e.target.value)} placeholder="••••••••" style={inp(!!errors.confirmPassword)} />
          </div>
          {errors.confirmPassword && <p style={{ margin: "2px 0 0", fontSize: 10.5, color: "#ef4444" }}>{errors.confirmPassword}</p>}
        </div>

        {/* Terms */}
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, cursor: "pointer" }}>
            <input type="checkbox" checked={form.agreeTerms} onChange={(e) => set("agreeTerms", e.target.checked)}
              style={{ marginTop: 2, width: 13, height: 13, accentColor: "#4f46e5", cursor: "pointer", flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "#475569", lineHeight: 1.4 }}>
              I agree to the{" "}
              <span style={{ color: "#4f46e5", fontWeight: 600, cursor: "pointer" }}>Terms of Service</span>{" "}and{" "}
              <span style={{ color: "#4f46e5", fontWeight: 600, cursor: "pointer" }}>Privacy Policy</span>
            </span>
          </label>
          {errors.agreeTerms && <p style={{ margin: "2px 0 0 21px", fontSize: 10.5, color: "#ef4444" }}>{errors.agreeTerms}</p>}
        </div>

        {/* Submit */}
        <button onClick={handleSubmit} style={{
          width: "100%", padding: "10px", borderRadius: 8, border: "none",
          background: "linear-gradient(135deg,#4f46e5,#6366f1)",
          color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 12,
        }}>Complete Registration →</button>

        {/* Divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          <span style={{ fontSize: 11, color: "#94a3b8" }}>OR CONTINUE WITH</span>
          <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        </div>

        {/* Google */}
        <button style={{
          width: "100%", padding: "9px 12px", borderRadius: 7,
          border: "1.5px solid #e2e8f0", background: "#fff",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          fontSize: 13, fontWeight: 600, color: "#334155", cursor: "pointer", marginBottom: 12,
        }}>
          <svg width="15" height="15" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          Sign up with Google
        </button>

        <p style={{ textAlign: "center", fontSize: 13, color: "#64748b", margin: 0 }}>
          Already have an account?{" "}
          <span style={{ color: "#4f46e5", fontWeight: 700, cursor: "pointer" }}>Sign in</span>
        </p>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 12, textAlign: "center", flexShrink: 0 }}>
        <p style={{ fontSize: 11, color: "#94a3b8", margin: "0 0 4px" }}>
          By creating an account, you agree to EduPulse's{" "}
          <span style={{ color: "#4f46e5", cursor: "pointer", textDecoration: "underline" }}>Academic Integrity Policy</span>,{" "}
          <span style={{ color: "#4f46e5", cursor: "pointer", textDecoration: "underline" }}>Student Privacy Policy</span>, and{" "}
          <span style={{ color: "#4f46e5", cursor: "pointer", textDecoration: "underline" }}>Data Usage Agreement</span>.
        </p>
        <p style={{ fontSize: 11, color: "#94a3b8", margin: 0, display: "flex", justifyContent: "center", gap: 8 }}>
          © 2024 EduPulse Systems Inc. <span>•</span>
          <span style={{ cursor: "pointer", color: "#64748b" }}>Student Portal</span> <span>•</span>
          <span style={{ cursor: "pointer", color: "#64748b" }}>IT Support</span>
        </p>
      </div>
    </div>
  );
}