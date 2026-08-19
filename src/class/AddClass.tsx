import { useEffect, useState } from "react";
import { classService } from "../api/classService";
import {
  Hash, Users, ChevronDown, Calendar, RotateCcw, AlertCircle, CheckCircle2, X,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  name: string;
  code: string;
  educationLevel: string;
  academicYear: string;
  term: string;
  description: string;
  classTeacher: string;
  assistantClassTeacher: string;
  maxStudents: string;
  status: "Active" | "Inactive";
}

interface FieldError { [key: string]: string; }

// ── Options ──────────────────────────────────────────────────────────────────

const CLASS_NAME_OPTIONS = ["Senior One", "Senior Two", "Senior Three", "Senior Four", "Senior Five", "Senior Six"];
const LEVEL_OPTIONS = ["O-Level", "A-Level"];
const TERM_OPTIONS = ["Term 1", "Term 2", "Term 3"];
const STATUS_OPTIONS: ("Active" | "Inactive")[] = ["Active", "Inactive"];

function futureAcademicYearOptions(): string[] {
  const y = new Date().getFullYear();
  return Array.from({ length: 6 }, (_, i) => String(y + i));
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      <div style={{ width: 3, height: 18, background: "#3b82f6", borderRadius: 2 }} />
      <span style={{ fontSize: 11.5, fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase" as const }}>{title}</span>
    </div>
  );
}

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", marginBottom: 6, display: "block" }}>
      {text} {required && <span style={{ color: "#ef4444" }}>*</span>}
    </label>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
      <AlertCircle size={13} color="#ef4444" />
      <span style={{ fontSize: 12, color: "#ef4444" }}>{msg}</span>
    </div>
  );
}

function SuccessToast({ message, onClose }: { message: string; onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      role="status"
      style={{
        position: "fixed", top: 24, right: 24, zIndex: 2000,
        display: "flex", alignItems: "flex-start", gap: 10,
        background: "#fff", border: "1px solid #bbf7d0", borderRadius: 12,
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)", padding: "14px 16px",
        minWidth: 280, maxWidth: 360,
        transform: visible ? "translateY(0)" : "translateY(-12px)",
        opacity: visible ? 1 : 0,
        transition: "transform 0.25s ease, opacity 0.25s ease",
      }}
    >
      <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <CheckCircle2 size={17} color="#10b981" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "#0f172a" }}>Success</p>
        <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "#64748b" }}>{message}</p>
      </div>
      <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 2, flexShrink: 0 }}>
        <X size={15} />
      </button>
    </div>
  );
}

function InputField({
  placeholder, value, onChange, icon, error, type = "text", readOnly = false,
}: {
  placeholder: string; value: string; onChange: (v: string) => void;
  icon?: React.ReactNode; error?: string; type?: string; readOnly?: boolean;
}) {
  return (
    <div style={{ position: "relative" }}>
      {icon && (
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none", display: "flex" }}>
          {icon}
        </div>
      )}
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: icon ? "10px 14px 10px 36px" : "10px 14px",
          borderRadius: 8, border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
          fontSize: 13.5, color: readOnly ? "#94a3b8" : "#0f172a",
          background: readOnly ? "#f8fafc" : "#fff",
          outline: "none", boxSizing: "border-box" as const,
          fontStyle: readOnly ? "italic" : "normal",
        }}
      />
    </div>
  );
}

function SelectField({
  placeholder, value, onChange, options, error, disabled = false,
}: {
  placeholder: string; value: string; onChange: (v: string) => void;
  options: string[]; error?: string; disabled?: boolean;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 36px 10px 14px",
          borderRadius: 8, border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
          fontSize: 13.5, color: value ? "#0f172a" : "#94a3b8",
          background: disabled ? "#f8fafc" : "#fff", outline: "none", appearance: "none" as const,
          boxSizing: "border-box" as const, cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown size={15} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
    </div>
  );
}

function YearSelect({
  value, onChange, options, error,
}: { value: string; onChange: (v: string) => void; options: string[]; error?: string }) {
  return (
    <div style={{ position: "relative" }}>
      <Calendar size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 36px 10px 36px",
          borderRadius: 8, border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
          fontSize: 13.5, color: value ? "#0f172a" : "#94a3b8",
          background: "#fff", outline: "none", appearance: "none" as const,
          boxSizing: "border-box" as const, cursor: "pointer",
        }}
      >
        <option value="" disabled>Select year</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown size={15} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
    </div>
  );
}

function TextArea({
  placeholder, value, onChange, rows = 3,
}: { placeholder: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0",
        fontSize: 13.5, color: "#0f172a", background: "#fff", outline: "none",
        resize: "vertical" as const, boxSizing: "border-box" as const, fontFamily: "inherit",
      }}
    />
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

const INITIAL_FORM: FormData = {
  name: "", code: "", educationLevel: "", academicYear: String(new Date().getFullYear()), term: "",
  description: "", classTeacher: "", assistantClassTeacher: "", maxStudents: "", status: "Active",
};

export default function AddClass({ embedded = false }: { embedded?: boolean }) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldError>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): boolean => {
    const e: FieldError = {};
    if (!form.name.trim()) e.name = "Please select a class name";
    if (!form.code.trim()) e.code = "Class code is required";
    if (!form.educationLevel) e.educationLevel = "Please select an education level";
    if (!form.academicYear) e.academicYear = "Please select an academic year";
    if (!form.classTeacher.trim()) e.classTeacher = "Class teacher is required";
    if (!form.maxStudents || Number(form.maxStudents) <= 0) e.maxStudents = "Enter a valid maximum student count";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    try {
      await classService.create({
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        educationLevel: form.educationLevel,
        academicYear: form.academicYear,
        term: form.term,
        description: form.description.trim(),
        classTeacher: form.classTeacher.trim(),
        assistantClassTeacher: form.assistantClassTeacher.trim() || undefined,
        maxStudents: Number(form.maxStudents),
        status: form.status,
      });
      setSuccessMessage("Class created successfully!");
      handleReset();
    } catch (error: any) {
      alert(error.response?.data?.message ?? "Failed to save class.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
  };

  return (
    <div style={{ minHeight: embedded ? undefined : "100vh", background: embedded ? "transparent" : "#f1f5f9", padding: embedded ? "20px" : "32px 24px", fontFamily: "'Inter', 'Segoe UI', sans-serif", textAlign: "left" as const }}>
      {successMessage && <SuccessToast message={successMessage} onClose={() => setSuccessMessage(null)} />}
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap" as const, gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12.5, color: "#94a3b8" }}>Academic Management <span style={{ margin: "0 4px" }}>›</span> Add Class</p>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: "6px 0 0" }}>Create Class</h1>
            <p style={{ fontSize: 13.5, color: "#64748b", margin: "6px 0 0" }}>Set up a new class, assign its teacher, and define its capacity.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 20, padding: "6px 14px", fontSize: 12.5, color: "#64748b", fontWeight: 500 }}>
            <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span> Required Information
          </div>
        </div>

        {/* ── Form Card ─────────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>

          <div style={{ padding: "20px 28px", borderBottom: "1px solid #f1f5f9" }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#3b82f6" }}>Class Details</p>
            <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "#94a3b8" }}>Fill in all sections to create the class.</p>
          </div>

          <div style={{ padding: "28px" }}>

            {/* ── 1. BASIC CLASS INFORMATION ────────────────────────────── */}
            <SectionHeader title="Basic Class Information" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="Class Name" required />
                <SelectField placeholder="Select class name" value={form.name} onChange={(v) => set("name", v)} options={CLASS_NAME_OPTIONS} error={errors.name} />
                {errors.name && <ErrorMsg msg={errors.name} />}
              </div>
              <div>
                <Label text="Class Code" required />
                <InputField placeholder="e.g. S1, S2" value={form.code} onChange={(v) => set("code", v)} icon={<Hash size={14} />} error={errors.code} />
                {errors.code && <ErrorMsg msg={errors.code} />}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="Education Level" required />
                <SelectField placeholder="Select level" value={form.educationLevel} onChange={(v) => set("educationLevel", v)} options={LEVEL_OPTIONS} error={errors.educationLevel} />
                {errors.educationLevel && <ErrorMsg msg={errors.educationLevel} />}
              </div>
              <div>
                <Label text="Academic Year" required />
                <YearSelect value={form.academicYear} onChange={(v) => set("academicYear", v)} options={futureAcademicYearOptions()} error={errors.academicYear} />
                {errors.academicYear && <ErrorMsg msg={errors.academicYear} />}
              </div>
              <div>
                <Label text="Term" />
                <SelectField placeholder="Select term" value={form.term} onChange={(v) => set("term", v)} options={TERM_OPTIONS} />
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Label text="Description" />
              <TextArea placeholder="Optional notes about this class..." value={form.description} onChange={(v) => set("description", v)} />
            </div>

            <div style={{ height: 1, background: "#f1f5f9", margin: "28px 0" }} />

            {/* ── 2. CLASS MANAGEMENT ───────────────────────────────────── */}
            <SectionHeader title="Class Management" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="Class Teacher" required />
                <InputField placeholder="Enter class teacher's name" value={form.classTeacher} onChange={(v) => set("classTeacher", v)} icon={<Users size={14} />} error={errors.classTeacher} />
                {errors.classTeacher && <ErrorMsg msg={errors.classTeacher} />}
              </div>
              <div>
                <Label text="Assistant Class Teacher" />
                <InputField placeholder="Optional" value={form.assistantClassTeacher} onChange={(v) => set("assistantClassTeacher", v)} icon={<Users size={14} />} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 8 }}>
              <div>
                <Label text="Maximum Students" required />
                <InputField placeholder="e.g. 120" value={form.maxStudents} onChange={(v) => set("maxStudents", v)} type="number" icon={<Users size={14} />} error={errors.maxStudents} />
                {errors.maxStudents && <ErrorMsg msg={errors.maxStudents} />}
              </div>
              <div>
                <Label text="Current Student Count" />
                <InputField placeholder="Auto-calculated" value="0" onChange={() => {}} icon={<Users size={14} />} readOnly />
              </div>
              <div>
                <Label text="Status" />
                <SelectField placeholder="Select status" value={form.status} onChange={(v) => set("status", v)} options={STATUS_OPTIONS} />
              </div>
            </div>
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div style={{ padding: "18px 28px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 12 }}>
            <button
              onClick={handleReset}
              style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#f97316", fontSize: 13.5, fontWeight: 600, padding: 0 }}
            >
              <RotateCcw size={14} /> Reset all fields
            </button>
            <div style={{ display: "flex", gap: 12 }}>
              <button style={{ padding: "10px 24px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13.5, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", fontSize: 13.5, fontWeight: 600, color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}
              >
                {saving ? "Saving..." : "Save Class"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
