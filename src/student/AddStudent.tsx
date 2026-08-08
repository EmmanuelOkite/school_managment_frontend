import { useState } from "react";
import { studentService } from '../api/studentService';
import {
  User, Hash, Search, Globe, Calendar,
  ChevronDown, X, RotateCcw, Info, AlertCircle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  studentId: string;
  level: string;
  surname: string;
  firstName: string;
  otherNames: string;
  classId: string;
  subjectCombination: string[];
  age: string;
  gender: string;
  nationality: string;
  dateOfBirth: string;
  parentName: string;
}

interface FieldError {
  [key: string]: string;
}

// ── Options ──────────────────────────────────────────────────────────────────

const LEVEL_OPTIONS = ["O Level", "A Level"];

const CLASS_OPTIONS = [
  "Senior One", "Senior Two", "Senior Three",
  "Senior Four", "Senior Five", "Senior Six",
];

const GENDER_OPTIONS = ["Male", "Female", "Other"];

const SUBJECT_OPTIONS = [
  "Mathematics", "English Language", "Physics", "Chemistry",
  "Biology", "History", "Geography", "Economics",
  "Literature", "Computer Science", "Art", "Music",
  "Physical Education", "Religious Education",
];

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
  placeholder, value, onChange, options, error,
}: {
  placeholder: string; value: string; onChange: (v: string) => void;
  options: string[]; error?: string;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 36px 10px 14px",
          borderRadius: 8, border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
          fontSize: 13.5, color: value ? "#0f172a" : "#94a3b8",
          background: "#fff", outline: "none", appearance: "none" as const,
          boxSizing: "border-box" as const, cursor: "pointer",
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown size={15} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
    </div>
  );
}

// ── Subject Combination Multi-select ────────────────────────────────────────

function SubjectSelect({
  selected, onChange, error,
}: {
  selected: string[]; onChange: (v: string[]) => void; error?: string;
}) {
  const [open, setOpen] = useState(false);

  const toggle = (subject: string) => {
    if (selected.includes(subject)) {
      onChange(selected.filter((s) => s !== subject));
    } else {
      onChange([...selected, subject]);
    }
  };

  const remove = (subject: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((s) => s !== subject));
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setOpen((p) => !p)}
        style={{
          minHeight: 44, padding: "6px 36px 6px 10px",
          borderRadius: 8, border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
          background: "#fff", cursor: "pointer", display: "flex", flexWrap: "wrap" as const, gap: 6, alignItems: "center",
          boxSizing: "border-box" as const,
        }}
      >
        {selected.length === 0 && (
          <span style={{ fontSize: 13.5, color: "#94a3b8" }}>Select subjects...</span>
        )}
        {selected.map((s) => (
          <span key={s} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "#eff6ff", color: "#3b82f6", fontSize: 12.5,
            fontWeight: 600, padding: "3px 8px", borderRadius: 20,
            border: "1px solid #bfdbfe",
          }}>
            {s}
            <span style={{ display: "flex", cursor: "pointer" }} onClick={(e) => remove(s, e)}>
              <X size={11} />
            </span>
          </span>
        ))}
        <ChevronDown size={15} style={{ position: "absolute", right: 12, top: 14, color: "#94a3b8" }} />
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 50,
          maxHeight: 220, overflowY: "auto",
        }}>
          {SUBJECT_OPTIONS.map((s) => (
            <div
              key={s}
              onClick={() => toggle(s)}
              style={{
                padding: "9px 14px", fontSize: 13.5, cursor: "pointer",
                color: selected.includes(s) ? "#3b82f6" : "#334155",
                background: selected.includes(s) ? "#eff6ff" : "transparent",
                fontWeight: selected.includes(s) ? 600 : 400,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              {s}
              {selected.includes(s) && <span style={{ color: "#3b82f6", fontSize: 12 }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Class Search field ───────────────────────────────────────────────────────

function ClassSearch({
  value, onChange, error,
}: {
  value: string; onChange: (v: string) => void; error?: string;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = CLASS_OPTIONS.filter((c) =>
    c.toLowerCase().includes(query.toLowerCase())
  );

  const select = (cls: string) => {
    onChange(cls);
    setQuery(cls);
    setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none", zIndex: 1 }} />
      <input
        value={query || value}
        onChange={(e) => { setQuery(e.target.value); setOpen(true); if (!e.target.value) onChange(""); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Search and select class..."
        style={{
          width: "100%", padding: "10px 14px 10px 34px",
          borderRadius: 8, border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
          fontSize: 13.5, color: "#0f172a", background: "#fff",
          outline: "none", boxSizing: "border-box" as const,
        }}
      />
      {open && filtered.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 50,
        }}>
          {filtered.map((c) => (
            <div key={c} onMouseDown={() => select(c)} style={{
              padding: "9px 14px", fontSize: 13.5, cursor: "pointer",
              color: value === c ? "#3b82f6" : "#334155",
              background: value === c ? "#eff6ff" : "transparent",
              fontWeight: value === c ? 600 : 400,
            }}>{c}</div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function AddStudent({ embedded = false }: { embedded?: boolean }) {
  const [form, setForm] = useState<FormData>({
    studentId: "S-2026-000123",
    level: "",
    surname: "",
    firstName: "",
    otherNames: "",
    classId: "",
    subjectCombination: [],
    age: "",
    gender: "",
    nationality: "",
    dateOfBirth: "",
    parentName: "",
  });

  const [errors, setErrors] = useState<FieldError>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const set = (field: keyof FormData, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const touch = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const validate = (): boolean => {
    const e: FieldError = {};
    if (!form.surname.trim()) e.surname = "Surname is required for legal documentation";
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.level) e.level = "Please select a level";
    if (!form.classId) e.classId = "Please select a class";
    if (!form.age || isNaN(Number(form.age))) e.age = "Please enter a valid age";
    if (!form.gender) e.gender = "Please select a gender";
    if (!form.nationality.trim()) e.nationality = "Nationality is required";
    if (!form.dateOfBirth) e.dateOfBirth = "Date of birth is required";
    if (!form.parentName.trim()) e.parentName = "Parent name is required";
    if (form.level === "A Level" && form.subjectCombination.length === 0)
      e.subjectCombination = "Select at least one subject for A Level";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
  if (validate()) {
    try {
      await studentService.create({
        studentId: form.studentId,
        surname: form.surname,
        firstName: form.firstName,
        otherNames: form.otherNames,
        class: form.classId,
        level: form.level,
        subjectCombination: form.subjectCombination.join(", "),
        age: Number(form.age),
        gender: form.gender,
        nationality: form.nationality,
        dateOfBirth: form.dateOfBirth,
        parentName: form.parentName,
      });

      alert("Student saved successfully!");

      // Optional: Reset the form after successful save
      handleReset();
    } catch (error: any) {
      alert(error.response?.data?.message ?? "Failed to save student.");
    }
  }
};

  const handleReset = () => {
    setForm({ studentId: "S-2026-000123", level: "", surname: "", firstName: "", otherNames: "", classId: "", subjectCombination: [], age: "", gender: "", nationality: "", dateOfBirth: "", parentName: "" });
    setErrors({});
    setTouched({});
  };

  const isALevel = form.level === "A Level";

  return (
    <div style={{ minHeight: embedded ? undefined : "100vh", background: embedded ? "transparent" : "#f1f5f9", padding: embedded ? "20px" : "32px 24px", fontFamily: "'Inter', 'Segoe UI', sans-serif", textAlign: "left" as const }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0 }}>Add New Student</h1>
            <p style={{ fontSize: 13.5, color: "#64748b", margin: "6px 0 0" }}>Register a new student into the school information system.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 20, padding: "6px 14px", fontSize: 12.5, color: "#64748b", fontWeight: 500 }}>
            <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span> Required Information
          </div>
        </div>

        {/* ── Form Card ─────────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>

          {/* Card header */}
          <div style={{ padding: "20px 28px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#3b82f6" }}>Student Profile Information</p>
              <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "#94a3b8" }}>Fill in all details to generate a student profile.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>
              <Info size={13} /> ID Generation Active
            </div>
          </div>

          <div style={{ padding: "28px" }}>

            {/* ── ACADEMIC IDENTITY ─────────────────────────────────────── */}
            <SectionHeader title="Academic Identity" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <Label text="Student ID" />
                  <span style={{ fontSize: 11.5, color: "#94a3b8", fontStyle: "italic" }}></span>
                </div>
                <InputField placeholder="Auto-generated" value={form.studentId} onChange={() => {}} icon={<Hash size={14} />} readOnly />
              </div>
              <div onBlur={() => touch("level")}>
                <Label text="Level" required />
                <SelectField placeholder="Select level" value={form.level} onChange={(v) => set("level", v)} options={LEVEL_OPTIONS} error={errors.level} />
                {errors.level && touched.level && <ErrorMsg msg={errors.level} />}
              </div>
            </div>

            <div style={{ height: 1, background: "#f1f5f9", marginBottom: 28 }} />

            {/* ── PERSONAL DETAILS ──────────────────────────────────────── */}
            <SectionHeader title="Personal Details" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div onBlur={() => touch("surname")}>
                <Label text="Surname" required />
                <InputField
                  placeholder="Enter student's last name"
                  value={form.surname}
                  onChange={(v) => set("surname", v)}
                  error={errors.surname}
                />
                {errors.surname && <ErrorMsg msg={errors.surname} />}
              </div>
              <div onBlur={() => touch("firstName")}>
                <Label text="First Name" required />
                <InputField
                  placeholder="Enter student's first name"
                  value={form.firstName}
                  onChange={(v) => set("firstName", v)}
                  error={errors.firstName}
                />
                {errors.firstName && <ErrorMsg msg={errors.firstName} />}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <Label text="Other Names" />
              <InputField placeholder="Enter other names (optional)" value={form.otherNames} onChange={(v) => set("otherNames", v)} icon={<User size={14} />} />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div onBlur={() => touch("classId")}>
                <Label text="Class" required />
                <ClassSearch value={form.classId} onChange={(v) => set("classId", v)} error={errors.classId} />
                {errors.classId && <ErrorMsg msg={errors.classId} />}
              </div>

              {isALevel ? (
                <div>
                  <Label text="Subject Combination" required />
                  <SubjectSelect selected={form.subjectCombination} onChange={(v) => set("subjectCombination", v)} error={errors.subjectCombination} />
                  {errors.subjectCombination && <ErrorMsg msg={errors.subjectCombination} />}
                </div>
              ) : (
                <div style={{ opacity: 0.4, pointerEvents: "none" }}>
                  <Label text="Subject Combination" />
                  <div style={{ padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13.5, color: "#94a3b8", background: "#f8fafc" }}>
                    Only available for A Level
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div onBlur={() => touch("age")}>
                <Label text="Age" required />
                <InputField placeholder="e.g. 15" value={form.age} onChange={(v) => set("age", v)} type="number" error={errors.age} />
                {errors.age && <ErrorMsg msg={errors.age} />}
              </div>
              <div onBlur={() => touch("gender")}>
                <Label text="Gender" required />
                <SelectField placeholder="Select gender" value={form.gender} onChange={(v) => set("gender", v)} options={GENDER_OPTIONS} error={errors.gender} />
                {errors.gender && touched.gender && <ErrorMsg msg={errors.gender} />}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 8 }}>
              <div onBlur={() => touch("nationality")}>
                <Label text="Nationality" required />
                <InputField placeholder="e.g. Ugandan" value={form.nationality} onChange={(v) => set("nationality", v)} icon={<Globe size={14} />} error={errors.nationality} />
                {errors.nationality && <ErrorMsg msg={errors.nationality} />}
              </div>
              <div onBlur={() => touch("dateOfBirth")}>
                <Label text="Date of Birth" required />
                <InputField placeholder="YYYY-MM-DD" value={form.dateOfBirth} onChange={(v) => set("dateOfBirth", v)} icon={<Calendar size={14} />} type="date" error={errors.dateOfBirth} />
                {errors.dateOfBirth && <ErrorMsg msg={errors.dateOfBirth} />}
              </div>
            </div>

            <div onBlur={() => touch("parentName")}>
              <Label text="Parent Name" required />
              <InputField
                placeholder="Enter parent/guardian's full name"
                value={form.parentName}
                onChange={(v) => set("parentName", v)}
                icon={<User size={14} />}
                error={errors.parentName}
              />
              {errors.parentName && <ErrorMsg msg={errors.parentName} />}
            </div>
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div style={{ padding: "18px 28px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
                style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", fontSize: 13.5, fontWeight: 600, color: "#fff", cursor: "pointer" }}
              >
                Save Student Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}