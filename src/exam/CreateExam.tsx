import { useEffect, useMemo, useRef, useState } from "react";
import { examService } from "../api/examService";
import { teacherService } from "../api/teacherService";
import { studentService } from "../api/studentService";
import {
  Hash, Calendar, Clock, MapPin, Building2, ChevronDown, X, Plus, Trash2,
  RotateCcw, Info, AlertCircle, ClipboardList, Users, Award, UserCheck,
  FileText,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  examName: string;
  examCode: string;
  examType: string;
  description: string;

  academicYear: string;
  term: string;
  classId: string;
  streamId: string;
  subjectId: string;
  teacherId: string;

  examDate: string;
  startTime: string;
  endTime: string;
  examRoom: string;

  totalMarks: string;
  passMark: string;
  weight: string;
  gradingScale: string;

  studentMode: "auto" | "manual";
  selectedStudentIds: string[];

  examinerId: string;
  invigilatorId: string;
  additionalInvigilatorId: string;

  building: string;
  seatArrangement: string;

  examInstructions: string;
  materialsAllowed: string;
  materialsNotAllowed: string;
  specialInstructions: string;

  status: string;
}

interface FieldError { [key: string]: string; }

interface QuestionRow {
  key: string;
  number: number;
  text: string;
  type: string;
  marks: string;
  section: string;
  difficulty: string;
  optionA: string; optionB: string; optionC: string; optionD: string;
  correctAnswer: string;
  instructions: string;
}

interface Person { id: string; name: string; }
interface Student { id: string; name: string; className: string; stream: string; }

// ── Options ──────────────────────────────────────────────────────────────────

const EXAM_TYPE_OPTIONS = ["Test", "Quiz", "Mid-Term", "End of Term", "Mock Exam", "Final Exam"];
const TERM_OPTIONS = ["Term 1", "Term 2", "Term 3"];
const SUBJECT_OPTIONS = [
  "Mathematics", "English Language", "Physics", "Chemistry",
  "Biology", "History", "Geography", "Economics",
  "Literature", "Computer Science", "Art", "Music",
  "Physical Education", "Religious Education",
];
const GRADING_SCALE_OPTIONS = ["Standard (A–F)", "Percentage Only", "Pass/Fail"];
const STATUS_OPTIONS = ["Draft", "Scheduled", "Ongoing", "Completed", "Cancelled"];
const QUESTION_TYPE_OPTIONS = ["Multiple Choice", "True/False", "Short Answer", "Essay", "Fill in the Blank"];
const DIFFICULTY_OPTIONS = ["Easy", "Medium", "Hard"];

function academicYearOptions(): string[] {
  const y = new Date().getFullYear();
  return [String(y - 1), String(y), String(y + 1)];
}

function computeDuration(start: string, end: string): string {
  if (!start || !end) return "—";
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) return "—";
  if (diff < 60) return `${diff} minutes`;
  const h = Math.floor(diff / 60), m = diff % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function blankQuestion(key: string, number: number): QuestionRow {
  return { key, number, text: "", type: "Multiple Choice", marks: "", section: "", difficulty: "Medium", optionA: "", optionB: "", optionC: "", optionD: "", correctAnswer: "", instructions: "" };
}

// ── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
      <div style={{ width: 3, height: 18, background: "#3b82f6", borderRadius: 2 }} />
      <span style={{ display: "flex", color: "#3b82f6" }}>{icon}</span>
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
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
      <ChevronDown size={15} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
    </div>
  );
}

function PersonSelect({
  placeholder, value, onChange, options, error, disabled = false,
}: {
  placeholder: string; value: string; onChange: (id: string) => void;
  options: Person[]; error?: string; disabled?: boolean;
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
        {options.map((opt) => (
          <option key={opt.id} value={opt.id}>{opt.name}</option>
        ))}
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

function MultiSelect({
  selected, onChange, options, placeholder, disabled = false,
}: { selected: string[]; onChange: (v: string[]) => void; options: Person[]; placeholder: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  const toggle = (id: string) => {
    if (selected.includes(id)) onChange(selected.filter((s) => s !== id));
    else onChange([...selected, id]);
  };

  const nameOf = (id: string) => options.find((o) => o.id === id)?.name ?? id;

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => !disabled && setOpen((p) => !p)}
        style={{
          minHeight: 44, padding: "6px 36px 6px 10px",
          borderRadius: 8, border: "1.5px solid #e2e8f0",
          background: disabled ? "#f8fafc" : "#fff", cursor: disabled ? "not-allowed" : "pointer",
          display: "flex", flexWrap: "wrap" as const, gap: 6, alignItems: "center",
          boxSizing: "border-box" as const,
        }}
      >
        {selected.length === 0 && (
          <span style={{ fontSize: 13.5, color: "#94a3b8" }}>{placeholder}</span>
        )}
        {selected.map((id) => (
          <span key={id} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "#eff6ff", color: "#3b82f6", fontSize: 12.5,
            fontWeight: 600, padding: "3px 8px", borderRadius: 20,
            border: "1px solid #bfdbfe",
          }}>
            {nameOf(id)}
            <span style={{ display: "flex", cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); toggle(id); }}>
              <X size={11} />
            </span>
          </span>
        ))}
        {!disabled && <ChevronDown size={15} style={{ position: "absolute", right: 12, top: 14, color: "#94a3b8" }} />}
      </div>

      {open && !disabled && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 50,
          maxHeight: 220, overflowY: "auto",
        }}>
          {options.length === 0 && (
            <div style={{ padding: "12px 14px", fontSize: 13, color: "#94a3b8" }}>No students match the selected class/stream.</div>
          )}
          {options.map((o) => (
            <div
              key={o.id}
              onClick={() => toggle(o.id)}
              style={{
                padding: "9px 14px", fontSize: 13.5, cursor: "pointer",
                color: selected.includes(o.id) ? "#3b82f6" : "#334155",
                background: selected.includes(o.id) ? "#eff6ff" : "transparent",
                fontWeight: selected.includes(o.id) ? 600 : 400,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              {o.name}
              {selected.includes(o.id) && <span style={{ color: "#3b82f6", fontSize: 12 }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

const INITIAL_FORM: FormData = {
  examName: "", examCode: "", examType: "", description: "",
  academicYear: String(new Date().getFullYear()), term: "", classId: "", streamId: "", subjectId: "", teacherId: "",
  examDate: "", startTime: "", endTime: "", examRoom: "",
  totalMarks: "", passMark: "", weight: "", gradingScale: "Standard (A–F)",
  studentMode: "auto", selectedStudentIds: [],
  examinerId: "", invigilatorId: "", additionalInvigilatorId: "",
  building: "", seatArrangement: "",
  examInstructions: "", materialsAllowed: "", materialsNotAllowed: "", specialInstructions: "",
  status: "Draft",
};

export default function CreateExam({ embedded = false }: { embedded?: boolean }) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldError>({});
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const nextQKey = useRef(1);

  const [teachers, setTeachers] = useState<Person[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadReferenceData = () => {
    setLoadingData(true);
    setLoadError(null);
    Promise.all([teacherService.getAll(), studentService.getAll()])
      .then(([tRes, sRes]) => {
        const rawTeachers = Array.isArray(tRes.data) ? tRes.data : tRes.data?.teachers ?? tRes.data?.data ?? [];
        setTeachers(rawTeachers.map((t: any) => ({
          id: String(t._id ?? t.id ?? t.teacherId),
          name: [t.firstName, t.middleName, t.lastName].filter(Boolean).join(" ").trim() || t.name || "Unnamed Teacher",
        })));

        const rawStudents = Array.isArray(sRes.data) ? sRes.data : sRes.data?.students ?? sRes.data?.data ?? [];
        setStudents(rawStudents.map((s: any) => ({
          id: String(s._id ?? s.id ?? s.studentId),
          name: [s.firstName, s.surname ?? s.lastName, s.otherNames].filter(Boolean).join(" ").trim() || s.name || "Unnamed Student",
          className: s.class ?? s.className ?? s.level ?? "—",
          stream: s.stream ?? s.section ?? "—",
        })));
      })
      .catch((err) => setLoadError(err.response?.data?.message ?? "Failed to load teachers/students for this form."))
      .finally(() => setLoadingData(false));
  };

  useEffect(() => { loadReferenceData(); }, []);

  const classOptions = useMemo(() => Array.from(new Set(students.map((s) => s.className).filter((c) => c && c !== "—"))), [students]);
  const streamOptions = useMemo(() => Array.from(new Set(students.map((s) => s.stream).filter((s) => s && s !== "—"))), [students]);

  const matchingStudents = useMemo(
    () => students.filter((s) => (!form.classId || s.className === form.classId) && (!form.streamId || s.stream === form.streamId)),
    [students, form.classId, form.streamId]
  );

  const numberOfStudents = form.studentMode === "auto" ? matchingStudents.length : form.selectedStudentIds.length;

  const set = (field: keyof FormData, value: string | string[]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const addQuestion = () => {
    const key = String(nextQKey.current++);
    setQuestions((prev) => [...prev, blankQuestion(key, prev.length + 1)]);
  };

  const removeQuestion = (key: string) => {
    setQuestions((prev) => prev.filter((q) => q.key !== key).map((q, i) => ({ ...q, number: i + 1 })));
  };

  const updateQuestion = (key: string, patch: Partial<QuestionRow>) => {
    setQuestions((prev) => prev.map((q) => q.key === key ? { ...q, ...patch } : q));
  };

  const validate = (): boolean => {
    const e: FieldError = {};
    if (!form.examName.trim()) e.examName = "Exam name is required";
    if (!form.examCode.trim()) e.examCode = "Exam code is required";
    if (!form.examType) e.examType = "Please select an exam type";

    if (!form.term) e.term = "Please select a term";
    if (!form.classId) e.classId = "Please select a class";
    if (!form.subjectId) e.subjectId = "Please select a subject";
    if (!form.teacherId) e.teacherId = "Please select a teacher";

    if (!form.examDate) e.examDate = "Exam date is required";
    if (!form.startTime) e.startTime = "Start time is required";
    if (!form.endTime) e.endTime = "End time is required";
    else if (form.startTime && computeDuration(form.startTime, form.endTime) === "—") e.endTime = "End time must be after start time";

    if (!form.totalMarks || Number(form.totalMarks) <= 0) e.totalMarks = "Enter a valid total marks value";
    if (!form.passMark || Number(form.passMark) <= 0) e.passMark = "Enter a valid pass mark";
    else if (form.totalMarks && Number(form.passMark) > Number(form.totalMarks)) e.passMark = "Pass mark cannot exceed total marks";

    if (form.studentMode === "manual" && form.selectedStudentIds.length === 0) e.selectedStudentIds = "Select at least one student";

    for (const q of questions) {
      if (!q.text.trim()) { e.questions = "Every question needs its question text filled in"; break; }
      if (!q.marks || Number(q.marks) <= 0) { e.questions = "Every question needs a valid marks value"; break; }
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      await examService.create({
        examName: form.examName, examCode: form.examCode, examType: form.examType, description: form.description,
        academicYear: form.academicYear, term: form.term, classId: form.classId, streamId: form.streamId,
        subjectId: form.subjectId, teacherId: form.teacherId,
        examDate: form.examDate, startTime: form.startTime, endTime: form.endTime,
        durationMinutes: computeDuration(form.startTime, form.endTime), examRoom: form.examRoom,
        totalMarks: Number(form.totalMarks), passMark: Number(form.passMark), weight: form.weight, gradingScale: form.gradingScale,
        studentAssignment: {
          mode: form.studentMode, classId: form.classId, streamId: form.streamId,
          studentIds: form.studentMode === "manual" ? form.selectedStudentIds : matchingStudents.map((s) => s.id),
          numberOfStudents,
        },
        examinerId: form.examinerId || form.teacherId, invigilatorId: form.invigilatorId, additionalInvigilatorId: form.additionalInvigilatorId,
        location: { room: form.examRoom, building: form.building, seatArrangement: form.seatArrangement },
        instructions: {
          examInstructions: form.examInstructions, materialsAllowed: form.materialsAllowed,
          materialsNotAllowed: form.materialsNotAllowed, specialInstructions: form.specialInstructions,
        },
        status: form.status,
        questions: questions.map((q) => ({
          number: q.number, text: q.text, type: q.type, marks: Number(q.marks) || 0,
          section: q.section, difficulty: q.difficulty,
          options: q.type === "Multiple Choice" ? [q.optionA, q.optionB, q.optionC, q.optionD] : undefined,
          correctAnswer: q.correctAnswer, instructions: q.instructions,
        })),
      });
      alert("Exam saved successfully!");
      handleReset();
    } catch (error: any) {
      alert(error.response?.data?.message ?? "Failed to save exam.");
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setQuestions([]);
  };

  return (
    <div style={{ minHeight: embedded ? undefined : "100vh", background: embedded ? "transparent" : "#f1f5f9", padding: embedded ? "20px" : "32px 24px", fontFamily: "'Inter', 'Segoe UI', sans-serif", textAlign: "left" as const }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap" as const, gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0 }}>Create Exam</h1>
            <p style={{ fontSize: 13.5, color: "#64748b", margin: "6px 0 0" }}>Schedule a new examination and (optionally) build its question paper.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 20, padding: "6px 14px", fontSize: 12.5, color: "#64748b", fontWeight: 500 }}>
            <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span> Required Information
          </div>
        </div>

        {loadError && (
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontSize: 12.5, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px" }}>
            <AlertCircle size={14} /> {loadError}
            <button onClick={loadReferenceData} style={{ marginLeft: 6, background: "none", border: "none", color: "#3b82f6", fontWeight: 600, cursor: "pointer", fontSize: 12.5 }}>Retry</button>
          </div>
        )}

        {/* ── Form Card ─────────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>

          <div style={{ padding: "20px 28px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 10 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#3b82f6" }}>Exam Details</p>
              <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "#94a3b8" }}>Fill in all sections to schedule the examination.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>
              <Info size={13} /> Status: {form.status}
            </div>
          </div>

          <div style={{ padding: "28px" }}>

            {/* ── 1. EXAM INFORMATION ───────────────────────────────────── */}
            <SectionHeader title="Exam Information" icon={<ClipboardList size={13} />} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="Exam Name" required />
                <InputField placeholder="e.g. Mid-Term Examination" value={form.examName} onChange={(v) => set("examName", v)} error={errors.examName} />
                {errors.examName && <ErrorMsg msg={errors.examName} />}
              </div>
              <div>
                <Label text="Exam Code" required />
                <InputField placeholder="e.g. MIDTERM-T2-2026" value={form.examCode} onChange={(v) => set("examCode", v)} icon={<Hash size={14} />} error={errors.examCode} />
                {errors.examCode && <ErrorMsg msg={errors.examCode} />}
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <Label text="Exam Type" required />
              <SelectField placeholder="Select exam type" value={form.examType} onChange={(v) => set("examType", v)} options={EXAM_TYPE_OPTIONS} error={errors.examType} />
              {errors.examType && <ErrorMsg msg={errors.examType} />}
            </div>
            <div style={{ marginBottom: 8 }}>
              <Label text="Description" />
              <TextArea placeholder="Optional notes about this exam..." value={form.description} onChange={(v) => set("description", v)} />
            </div>

            <div style={{ height: 1, background: "#f1f5f9", margin: "28px 0" }} />

            {/* ── 2. ACADEMIC INFORMATION ──────────────────────────────── */}
            <SectionHeader title="Academic Information" icon={<Award size={13} />} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="Academic Year" required />
                <SelectField placeholder="Select year" value={form.academicYear} onChange={(v) => set("academicYear", v)} options={academicYearOptions()} />
              </div>
              <div>
                <Label text="Term" required />
                <SelectField placeholder="Select term" value={form.term} onChange={(v) => set("term", v)} options={TERM_OPTIONS} error={errors.term} />
                {errors.term && <ErrorMsg msg={errors.term} />}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="Class/Grade" required />
                <SelectField placeholder="Select class" value={form.classId} onChange={(v) => set("classId", v)} options={classOptions} error={errors.classId} disabled={loadingData} />
                {errors.classId && <ErrorMsg msg={errors.classId} />}
              </div>
              <div>
                <Label text="Stream" />
                <SelectField placeholder="All Streams" value={form.streamId} onChange={(v) => set("streamId", v)} options={streamOptions} disabled={loadingData} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 8 }}>
              <div>
                <Label text="Subject" required />
                <SelectField placeholder="Select subject" value={form.subjectId} onChange={(v) => set("subjectId", v)} options={SUBJECT_OPTIONS} error={errors.subjectId} />
                {errors.subjectId && <ErrorMsg msg={errors.subjectId} />}
              </div>
              <div>
                <Label text="Teacher/Examiner" required />
                <PersonSelect
                  placeholder={loadingData ? "Loading teachers..." : "Select teacher"}
                  value={form.teacherId}
                  onChange={(v) => set("teacherId", v)}
                  options={teachers}
                  error={errors.teacherId}
                  disabled={loadingData}
                />
                {errors.teacherId && <ErrorMsg msg={errors.teacherId} />}
              </div>
            </div>

            <div style={{ height: 1, background: "#f1f5f9", margin: "28px 0" }} />

            {/* ── 3. EXAM SCHEDULE ──────────────────────────────────────── */}
            <SectionHeader title="Exam Schedule" icon={<Calendar size={13} />} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="Exam Date" required />
                <InputField placeholder="YYYY-MM-DD" value={form.examDate} onChange={(v) => set("examDate", v)} icon={<Calendar size={14} />} type="date" error={errors.examDate} />
                {errors.examDate && <ErrorMsg msg={errors.examDate} />}
              </div>
              <div>
                <Label text="Exam Room/Hall" />
                <InputField placeholder="e.g. Room A3" value={form.examRoom} onChange={(v) => set("examRoom", v)} icon={<MapPin size={14} />} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 8 }}>
              <div>
                <Label text="Start Time" required />
                <InputField placeholder="HH:MM" value={form.startTime} onChange={(v) => set("startTime", v)} icon={<Clock size={14} />} type="time" error={errors.startTime} />
                {errors.startTime && <ErrorMsg msg={errors.startTime} />}
              </div>
              <div>
                <Label text="End Time" required />
                <InputField placeholder="HH:MM" value={form.endTime} onChange={(v) => set("endTime", v)} icon={<Clock size={14} />} type="time" error={errors.endTime} />
                {errors.endTime && <ErrorMsg msg={errors.endTime} />}
              </div>
              <div>
                <Label text="Duration" />
                <InputField placeholder="Auto-calculated" value={computeDuration(form.startTime, form.endTime)} onChange={() => {}} icon={<Clock size={14} />} readOnly />
              </div>
            </div>

            <div style={{ height: 1, background: "#f1f5f9", margin: "28px 0" }} />

            {/* ── 4. MARKS & GRADING ────────────────────────────────────── */}
            <SectionHeader title="Marks & Grading" icon={<Award size={13} />} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="Total Marks" required />
                <InputField placeholder="e.g. 100" value={form.totalMarks} onChange={(v) => set("totalMarks", v)} type="number" error={errors.totalMarks} />
                {errors.totalMarks && <ErrorMsg msg={errors.totalMarks} />}
              </div>
              <div>
                <Label text="Pass Mark" required />
                <InputField placeholder="e.g. 50" value={form.passMark} onChange={(v) => set("passMark", v)} type="number" error={errors.passMark} />
                {errors.passMark && <ErrorMsg msg={errors.passMark} />}
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 8 }}>
              <div>
                <Label text="Weight/Percentage" />
                <InputField placeholder="e.g. 30%" value={form.weight} onChange={(v) => set("weight", v)} />
              </div>
              <div>
                <Label text="Grading Scale" />
                <SelectField placeholder="Select scale" value={form.gradingScale} onChange={(v) => set("gradingScale", v)} options={GRADING_SCALE_OPTIONS} />
              </div>
            </div>

            <div style={{ height: 1, background: "#f1f5f9", margin: "28px 0" }} />

            {/* ── 5. STUDENTS ───────────────────────────────────────────── */}
            <SectionHeader title="Students" icon={<Users size={13} />} />
            <div style={{ marginBottom: 14 }}>
              <Label text="Assignment Method" />
              <div style={{ display: "flex", gap: 20 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13.5, color: "#0f172a" }}>
                  <input type="radio" name="studentMode" checked={form.studentMode === "auto"} onChange={() => set("studentMode", "auto")} style={{ accentColor: "#3b82f6", cursor: "pointer" }} />
                  Automatically include all students in Class + Stream
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13.5, color: "#0f172a" }}>
                  <input type="radio" name="studentMode" checked={form.studentMode === "manual"} onChange={() => set("studentMode", "manual")} style={{ accentColor: "#3b82f6", cursor: "pointer" }} />
                  Manually select students
                </label>
              </div>
              <p style={{ margin: "8px 0 0", fontSize: 12, color: "#94a3b8" }}>Recommended: automatic assignment based on the Class and Stream chosen above.</p>
            </div>

            {form.studentMode === "manual" && (
              <div style={{ marginBottom: 14 }}>
                <Label text="Selected Students" required />
                <MultiSelect
                  selected={form.selectedStudentIds}
                  onChange={(v) => set("selectedStudentIds", v)}
                  options={matchingStudents.map((s) => ({ id: s.id, name: s.name }))}
                  placeholder={form.classId ? "Select students..." : "Choose a class first"}
                  disabled={!form.classId}
                />
                {errors.selectedStudentIds && <ErrorMsg msg={errors.selectedStudentIds} />}
              </div>
            )}

            <div style={{ marginBottom: 8 }}>
              <Label text="Number of Students" />
              <InputField placeholder="—" value={String(numberOfStudents)} onChange={() => {}} icon={<Users size={14} />} readOnly />
            </div>

            <div style={{ height: 1, background: "#f1f5f9", margin: "28px 0" }} />

            {/* ── 6. EXAMINATION STAFF ──────────────────────────────────── */}
            <SectionHeader title="Examination Staff" icon={<UserCheck size={13} />} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="Examiner/Teacher" />
                <PersonSelect
                  placeholder={loadingData ? "Loading..." : "Defaults to subject teacher"}
                  value={form.examinerId}
                  onChange={(v) => set("examinerId", v)}
                  options={teachers}
                  disabled={loadingData}
                />
              </div>
              <div>
                <Label text="Invigilator" />
                <PersonSelect
                  placeholder={loadingData ? "Loading..." : "Select invigilator"}
                  value={form.invigilatorId}
                  onChange={(v) => set("invigilatorId", v)}
                  options={teachers}
                  disabled={loadingData}
                />
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Label text="Additional Invigilator" />
              <PersonSelect
                placeholder={loadingData ? "Loading..." : "Optional"}
                value={form.additionalInvigilatorId}
                onChange={(v) => set("additionalInvigilatorId", v)}
                options={teachers}
                disabled={loadingData}
              />
            </div>

            <div style={{ height: 1, background: "#f1f5f9", margin: "28px 0" }} />

            {/* ── 7. LOCATION ───────────────────────────────────────────── */}
            <SectionHeader title="Location" icon={<Building2 size={13} />} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="Examination Room/Hall" />
                <InputField placeholder="Shares the room set in Schedule" value={form.examRoom} onChange={(v) => set("examRoom", v)} icon={<MapPin size={14} />} />
              </div>
              <div>
                <Label text="Building" />
                <InputField placeholder="e.g. Main Block" value={form.building} onChange={(v) => set("building", v)} icon={<Building2 size={14} />} />
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Label text="Seat Arrangement" />
              <TextArea placeholder="Optional seating plan notes..." value={form.seatArrangement} onChange={(v) => set("seatArrangement", v)} rows={2} />
            </div>

            <div style={{ height: 1, background: "#f1f5f9", margin: "28px 0" }} />

            {/* ── 8. INSTRUCTIONS ───────────────────────────────────────── */}
            <SectionHeader title="Instructions" icon={<FileText size={13} />} />
            <div style={{ marginBottom: 20 }}>
              <Label text="Exam Instructions" />
              <TextArea placeholder={"Answer all questions.\nBring your own calculator.\nStudents should arrive 15 minutes before the examination."} value={form.examInstructions} onChange={(v) => set("examInstructions", v)} rows={4} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="Materials Allowed" />
                <InputField placeholder="e.g. Calculator, ruler" value={form.materialsAllowed} onChange={(v) => set("materialsAllowed", v)} />
              </div>
              <div>
                <Label text="Materials Not Allowed" />
                <InputField placeholder="e.g. Mobile phones, notes" value={form.materialsNotAllowed} onChange={(v) => set("materialsNotAllowed", v)} />
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Label text="Special Instructions" />
              <TextArea placeholder="Optional additional notes..." value={form.specialInstructions} onChange={(v) => set("specialInstructions", v)} rows={2} />
            </div>

            <div style={{ height: 1, background: "#f1f5f9", margin: "28px 0" }} />

            {/* ── 9. STATUS ─────────────────────────────────────────────── */}
            <SectionHeader title="Status" icon={<Info size={13} />} />
            <div style={{ marginBottom: 8, maxWidth: 320 }}>
              <SelectField placeholder="Select status" value={form.status} onChange={(v) => set("status", v)} options={STATUS_OPTIONS} />
            </div>

            <div style={{ height: 1, background: "#f1f5f9", margin: "28px 0" }} />

            {/* ── QUESTIONS ─────────────────────────────────────────────── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <SectionHeader title={`Questions (${questions.length})`} icon={<ClipboardList size={13} />} />
              <button onClick={addQuestion} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#3b82f6", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={14} /> Add Question
              </button>
            </div>

            {errors.questions && <div style={{ marginBottom: 16 }}><ErrorMsg msg={errors.questions} /></div>}

            {questions.length === 0 ? (
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>No questions added yet. This is optional — you can build the question paper later.</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
                {questions.map((q) => (
                  <div key={q.key} style={{ border: "1.5px solid #e2e8f0", borderRadius: 10, padding: 18, background: "#f8fafc" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#3b82f6" }}>Question {q.number}</span>
                      <button onClick={() => removeQuestion(q.key)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontWeight: 600 }}>
                        <Trash2 size={13} /> Remove
                      </button>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <Label text="Question Text" required />
                      <TextArea placeholder="Enter the question..." value={q.text} onChange={(v) => updateQuestion(q.key, { text: v })} rows={2} />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                      <div>
                        <Label text="Question Type" />
                        <SelectField placeholder="Select type" value={q.type} onChange={(v) => updateQuestion(q.key, { type: v })} options={QUESTION_TYPE_OPTIONS} />
                      </div>
                      <div>
                        <Label text="Marks" required />
                        <InputField placeholder="e.g. 5" value={q.marks} onChange={(v) => updateQuestion(q.key, { marks: v })} type="number" />
                      </div>
                      <div>
                        <Label text="Difficulty" />
                        <SelectField placeholder="Select difficulty" value={q.difficulty} onChange={(v) => updateQuestion(q.key, { difficulty: v })} options={DIFFICULTY_OPTIONS} />
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <Label text="Section" />
                      <InputField placeholder="e.g. Section A" value={q.section} onChange={(v) => updateQuestion(q.key, { section: v })} />
                    </div>

                    {q.type === "Multiple Choice" && (
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                        <InputField placeholder="Option A" value={q.optionA} onChange={(v) => updateQuestion(q.key, { optionA: v })} />
                        <InputField placeholder="Option B" value={q.optionB} onChange={(v) => updateQuestion(q.key, { optionB: v })} />
                        <InputField placeholder="Option C" value={q.optionC} onChange={(v) => updateQuestion(q.key, { optionC: v })} />
                        <InputField placeholder="Option D" value={q.optionD} onChange={(v) => updateQuestion(q.key, { optionD: v })} />
                      </div>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                      <div>
                        <Label text="Correct Answer" />
                        {q.type === "Multiple Choice" ? (
                          <SelectField placeholder="Select correct option" value={q.correctAnswer} onChange={(v) => updateQuestion(q.key, { correctAnswer: v })} options={["Option A", "Option B", "Option C", "Option D"]} />
                        ) : q.type === "True/False" ? (
                          <SelectField placeholder="Select answer" value={q.correctAnswer} onChange={(v) => updateQuestion(q.key, { correctAnswer: v })} options={["True", "False"]} />
                        ) : (
                          <InputField placeholder="Model answer (optional)" value={q.correctAnswer} onChange={(v) => updateQuestion(q.key, { correctAnswer: v })} />
                        )}
                      </div>
                      <div>
                        <Label text="Instructions" />
                        <InputField placeholder="Optional note for this question" value={q.instructions} onChange={(v) => updateQuestion(q.key, { instructions: v })} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
                style={{ padding: "10px 28px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", fontSize: 13.5, fontWeight: 600, color: "#fff", cursor: "pointer" }}
              >
                Save Exam
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
