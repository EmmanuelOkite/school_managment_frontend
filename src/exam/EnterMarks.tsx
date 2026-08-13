import { useEffect, useMemo, useRef, useState } from "react";
import { examService } from "../api/examService";
import { teacherService } from "../api/teacherService";
import { studentService } from "../api/studentService";
import { marksService } from "../api/marksService";
import {
  ChevronDown, AlertCircle, Users, RotateCcw, Save, FileText, Send,
  Rocket, Settings2, StickyNote, Plus, Trash2, BarChart2,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface QuestionDef { number: number; text: string; marks: number; }

interface ExamRecord {
  id: string;
  examName: string;
  academicYear: string;
  term: string;
  classId: string;
  streamId: string;
  subjectId: string;
  teacherId: string;
  examDate: string;
  totalMarks: number;
  passMark: number;
  gradingScale: string;
  questions: QuestionDef[];
  studentMode: "auto" | "manual" | "";
  studentIds: string[];
}

interface Teacher { id: string; name: string; }
interface Student { id: string; admissionNo: string; name: string; className: string; stream: string; }
interface GradeBand { grade: string; min: number; }

interface MarkRow {
  studentId: string;
  admissionNo: string;
  name: string;
  questionMarks: Record<number, string>;
  simpleMarks: string;
  remarks: string;
}

const REMARK_PRESETS = ["Excellent", "Very Good", "Good", "Needs Improvement", "Poor"];
const DEFAULT_GRADING_SCALE: GradeBand[] = [
  { grade: "A", min: 80 }, { grade: "B", min: 70 }, { grade: "C", min: 60 },
  { grade: "D", min: 50 }, { grade: "F", min: 0 },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeExam(raw: any): ExamRecord {
  const questions = Array.isArray(raw.questions)
    ? raw.questions.map((q: any) => ({ number: Number(q.number) || 0, text: q.text ?? "", marks: Number(q.marks) || 0 }))
    : [];
  return {
    id: String(raw._id ?? raw.id),
    examName: raw.examName ?? "Untitled Exam",
    academicYear: String(raw.academicYear ?? ""),
    term: raw.term ?? "",
    classId: raw.classId ?? "",
    streamId: raw.streamId ?? "",
    subjectId: raw.subjectId ?? "",
    teacherId: raw.teacherId ?? "",
    examDate: raw.examDate ?? "",
    totalMarks: Number(raw.totalMarks) || 0,
    passMark: Number(raw.passMark) || 0,
    gradingScale: raw.gradingScale ?? "Standard (A–F)",
    questions,
    studentMode: raw.studentAssignment?.mode ?? "auto",
    studentIds: Array.isArray(raw.studentAssignment?.studentIds) ? raw.studentAssignment.studentIds : [],
  };
}

function normalizeTeacher(raw: any): Teacher {
  return {
    id: String(raw._id ?? raw.id ?? raw.teacherId),
    name: [raw.firstName, raw.middleName, raw.lastName].filter(Boolean).join(" ").trim() || raw.name || "Unnamed Teacher",
  };
}

function normalizeStudent(raw: any): Student {
  return {
    id: String(raw._id ?? raw.id ?? raw.studentId),
    admissionNo: String(raw.admissionNo ?? raw.admissionNumber ?? raw.studentId ?? "—"),
    name: [raw.firstName, raw.surname ?? raw.lastName, raw.otherNames].filter(Boolean).join(" ").trim() || raw.name || "Unnamed Student",
    className: raw.class ?? raw.className ?? raw.level ?? "—",
    stream: raw.stream ?? raw.section ?? "—",
  };
}

function computeGrade(pct: number, scale: GradeBand[]): string {
  const sorted = [...scale].sort((a, b) => b.min - a.min);
  return sorted.find((b) => pct >= b.min)?.grade ?? sorted[sorted.length - 1]?.grade ?? "—";
}

function blankRow(s: Student): MarkRow {
  return { studentId: s.id, admissionNo: s.admissionNo, name: s.name, questionMarks: {}, simpleMarks: "", remarks: "" };
}

// ── Small pieces ─────────────────────────────────────────────────────────────

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 170 }}>
      <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Select({
  value, onChange, options, placeholder, disabled = false,
}: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string; disabled?: boolean }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value} disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "9px 32px 9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0",
          fontSize: 13, color: value ? "#0f172a" : "#94a3b8", background: disabled ? "#f8fafc" : "#fff", outline: "none",
          appearance: "none" as const, cursor: disabled ? "not-allowed" : "pointer", boxSizing: "border-box" as const,
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
    </div>
  );
}

function IdSelect({
  value, onChange, options, placeholder, disabled = false,
}: { value: string; onChange: (v: string) => void; options: { id: string; label: string }[]; placeholder: string; disabled?: boolean }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value} disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "9px 32px 9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0",
          fontSize: 13, color: value ? "#0f172a" : "#94a3b8", background: disabled ? "#f8fafc" : "#fff", outline: "none",
          appearance: "none" as const, cursor: disabled ? "not-allowed" : "pointer", boxSizing: "border-box" as const,
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => <option key={opt.id} value={opt.id}>{opt.label}</option>)}
      </select>
      <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
    </div>
  );
}

function InfoChip({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px" }}>
      <p style={{ margin: 0, fontSize: 10.5, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{label}</p>
      <p style={{ margin: "3px 0 0", fontSize: 13.5, fontWeight: 600, color: "#0f172a" }}>{value || "—"}</p>
    </div>
  );
}

function MarkInput({ value, onChange, max }: { value: string; onChange: (v: string) => void; max: number }) {
  return (
    <input
      type="number" min={0} max={max} value={value}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "") { onChange(""); return; }
        const n = Math.max(0, Math.min(max, Number(v)));
        onChange(String(n));
      }}
      placeholder="—"
      style={{ width: 64, padding: "6px 8px", borderRadius: 7, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#0f172a", outline: "none", boxSizing: "border-box" as const, textAlign: "center" as const }}
    />
  );
}

function ResultBadge({ result }: { result: string }) {
  const pass = result === "Pass";
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase" as const,
      padding: "3px 10px", borderRadius: 20,
      color: pass ? "#10b981" : "#ef4444", background: pass ? "#f0fdf4" : "#fef2f2",
    }}>
      {result}
    </span>
  );
}

function RemarksField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } };
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKeyDown, true);
    return () => { document.removeEventListener("mousedown", onClickOutside); window.removeEventListener("keydown", onKeyDown, true); };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "flex", alignItems: "center", gap: 4 }}>
      <input
        value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="Add remark..."
        style={{ width: 150, padding: "6px 8px", borderRadius: 7, border: "1.5px solid #e2e8f0", fontSize: 12.5, color: "#0f172a", outline: "none", boxSizing: "border-box" as const }}
      />
      <button onClick={() => setOpen((p) => !p)} title="Quick remarks" style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 4 }}>
        <StickyNote size={13} />
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 4px)", background: "#fff",
          border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          minWidth: 160, zIndex: 60, overflow: "hidden",
        }}>
          {REMARK_PRESETS.map((r) => (
            <button
              key={r}
              onClick={() => { onChange(r); setOpen(false); }}
              style={{ width: "100%", textAlign: "left" as const, padding: "8px 12px", background: "none", border: "none", cursor: "pointer", fontSize: 12.5, color: "#334155" }}
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, color, bg }: { label: string; value: string; color: string; bg?: string }) {
  return (
    <div style={{ background: bg ?? "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 8px", textAlign: "center" as const }}>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color }}>{value}</p>
      <p style={{ margin: "2px 0 0", fontSize: 10, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{label}</p>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function EnterMarks({ embedded = false }: { embedded?: boolean }) {
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [academicYearFilter, setAcademicYearFilter] = useState("");
  const [termFilter, setTermFilter] = useState("");
  const [examId, setExamId] = useState("");

  const [roster, setRoster] = useState<MarkRow[] | null>(null);
  const [isExisting, setIsExisting] = useState(false);
  const [gradingScale, setGradingScale] = useState<GradeBand[]>(DEFAULT_GRADING_SCALE);
  const [showScaleEditor, setShowScaleEditor] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [rosterError, setRosterError] = useState<string | null>(null);

  const loadReferenceData = () => {
    setLoading(true);
    setLoadError(null);
    Promise.all([examService.getAll(), teacherService.getAll(), studentService.getAll()])
      .then(([examRes, teacherRes, studentRes]) => {
        const rawExams = Array.isArray(examRes.data) ? examRes.data : examRes.data?.exams ?? examRes.data?.data ?? [];
        setExams(rawExams.map(normalizeExam));
        const rawTeachers = Array.isArray(teacherRes.data) ? teacherRes.data : teacherRes.data?.teachers ?? teacherRes.data?.data ?? [];
        setTeachers(rawTeachers.map(normalizeTeacher));
        const rawStudents = Array.isArray(studentRes.data) ? studentRes.data : studentRes.data?.students ?? studentRes.data?.data ?? [];
        setStudents(rawStudents.map(normalizeStudent));
      })
      .catch((err) => setLoadError(err.response?.data?.message ?? "Failed to load exams."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadReferenceData(); }, []);

  const academicYearOptions = useMemo(() => Array.from(new Set(exams.map((e) => e.academicYear).filter(Boolean))), [exams]);
  const termOptions = useMemo(() => Array.from(new Set(exams.map((e) => e.term).filter(Boolean))), [exams]);
  const examOptions = useMemo(
    () => exams.filter((e) => (!academicYearFilter || e.academicYear === academicYearFilter) && (!termFilter || e.term === termFilter)),
    [exams, academicYearFilter, termFilter]
  );

  const selectedExam = useMemo(() => exams.find((e) => e.id === examId) ?? null, [exams, examId]);
  const teacherName = (id: string) => teachers.find((t) => t.id === id)?.name ?? "—";
  const usesQuestions = (selectedExam?.questions.length ?? 0) > 0;
  const showGrade = selectedExam?.gradingScale === "Standard (A–F)";
  const showConfigurableScale = showGrade;

  // ── Auto-load class/subject/questions/students once an exam is chosen ─────
  useEffect(() => {
    if (!selectedExam) { setRoster(null); return; }

    const matching = selectedExam.studentMode === "manual" && selectedExam.studentIds.length > 0
      ? students.filter((s) => selectedExam.studentIds.includes(s.id))
      : students.filter((s) => (!selectedExam.classId || s.className === selectedExam.classId) && (!selectedExam.streamId || s.stream === selectedExam.streamId));

    const blankRoster = matching.map(blankRow);
    setRoster(blankRoster);
    setIsExisting(false);
    setGradingScale(DEFAULT_GRADING_SCALE);
    setRosterError(null);

    marksService.getForExam(selectedExam.id)
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.records ?? res.data?.data ?? [];
        if (!Array.isArray(raw) || raw.length === 0) return;
        setIsExisting(true);
        setRoster((prev) => (prev ?? blankRoster).map((row) => {
          const existing = raw.find((r: any) => String(r.studentId) === row.studentId);
          if (!existing) return row;
          const questionMarks: Record<number, string> = {};
          if (existing.questionMarks) {
            Object.entries(existing.questionMarks).forEach(([k, v]) => { questionMarks[Number(k)] = String(v); });
          }
          return {
            ...row,
            questionMarks,
            simpleMarks: existing.marks != null ? String(existing.marks) : "",
            remarks: existing.remarks ?? "",
          };
        }));
      })
      .catch(() => { /* no marks saved yet for this exam - treat as a fresh entry */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examId, students]);

  const updateRow = (studentId: string, patch: Partial<MarkRow>) => {
    setRoster((prev) => prev && prev.map((r) => r.studentId === studentId ? { ...r, ...patch } : r));
  };

  const rowStats = (row: MarkRow) => {
    if (!selectedExam) return { total: 0, percentage: 0, grade: "—", result: "Fail" };
    const total = usesQuestions
      ? selectedExam.questions.reduce((sum, q) => sum + (Number(row.questionMarks[q.number]) || 0), 0)
      : Number(row.simpleMarks) || 0;
    const percentage = selectedExam.totalMarks > 0 ? (total / selectedExam.totalMarks) * 100 : 0;
    const grade = showGrade ? computeGrade(percentage, gradingScale) : "—";
    const result = percentage >= selectedExam.passMark ? "Pass" : "Fail";
    return { total, percentage, grade, result };
  };

  const isRowComplete = (row: MarkRow) => {
    if (!selectedExam) return false;
    if (usesQuestions) return selectedExam.questions.every((q) => row.questionMarks[q.number] !== undefined && row.questionMarks[q.number] !== "");
    return row.simpleMarks !== "";
  };

  const summary = useMemo(() => {
    if (!roster || roster.length === 0) return null;
    const stats = roster.map(rowStats);
    const percentages = stats.map((s) => s.percentage);
    const passCount = stats.filter((s) => s.result === "Pass").length;
    return {
      average: percentages.reduce((a, b) => a + b, 0) / percentages.length,
      highest: Math.max(...percentages),
      lowest: Math.min(...percentages),
      passCount, failCount: stats.length - passCount,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster, selectedExam, gradingScale]);

  const updateGradeBand = (idx: number, patch: Partial<GradeBand>) => {
    setGradingScale((prev) => prev.map((b, i) => i === idx ? { ...b, ...patch } : b));
  };
  const removeGradeBand = (idx: number) => setGradingScale((prev) => prev.filter((_, i) => i !== idx));
  const addGradeBand = () => setGradingScale((prev) => [...prev, { grade: "", min: 0 }]);

  const buildPayload = (status: string) => ({
    examId: selectedExam?.id, academicYear: selectedExam?.academicYear, term: selectedExam?.term,
    classId: selectedExam?.classId, streamId: selectedExam?.streamId, subjectId: selectedExam?.subjectId,
    teacherId: selectedExam?.teacherId, totalMarks: selectedExam?.totalMarks, passMark: selectedExam?.passMark,
    gradingScale: showConfigurableScale ? gradingScale : undefined,
    status,
    records: (roster ?? []).map((r) => {
      const stats = rowStats(r);
      return {
        studentId: r.studentId, admissionNo: r.admissionNo,
        marks: usesQuestions ? undefined : Number(r.simpleMarks) || 0,
        questionMarks: usesQuestions ? r.questionMarks : undefined,
        total: stats.total, percentage: stats.percentage, grade: stats.grade, result: stats.result,
        remarks: r.remarks,
      };
    }),
  });

  const allComplete = (roster ?? []).every(isRowComplete);

  useEffect(() => {
    if (allComplete) setRosterError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allComplete]);

  const runAction = async (kind: "draft" | "save" | "submit" | "publish") => {
    if (!selectedExam || !roster || roster.length === 0) return;
    if (kind !== "draft" && !allComplete) {
      setRosterError("Every student needs marks entered before you can " + (kind === "publish" ? "publish results." : "submit/save marks."));
      return;
    }
    setRosterError(null);
    setSaving(kind);
    try {
      if (kind === "draft") await marksService.saveDraft(buildPayload("Draft"));
      else if (kind === "save") { await marksService.save(buildPayload(isExisting ? "Draft" : "Draft")); setIsExisting(true); }
      else if (kind === "submit") await marksService.submit(buildPayload("Submitted"));
      else await marksService.publish(buildPayload("Published"));
      alert({
        draft: "Draft saved.", save: isExisting ? "Marks updated." : "Marks saved.",
        submit: "Marks submitted successfully!", publish: "Results published!",
      }[kind]);
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Something went wrong. Please try again.");
    } finally {
      setSaving(null);
    }
  };

  const handleResetMarks = () => {
    setRoster((prev) => prev && prev.map((r) => ({ ...r, questionMarks: {}, simpleMarks: "", remarks: "" })));
    setRosterError(null);
  };

  return (
    <div style={{ minHeight: embedded ? undefined : "100vh", background: embedded ? "transparent" : "#f1f5f9", padding: embedded ? "20px" : "28px 28px", fontFamily: "'Inter', 'Segoe UI', sans-serif", textAlign: "left" as const }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 12.5, color: "#94a3b8" }}>Examinations <span style={{ margin: "0 4px" }}>›</span> Enter Marks</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "4px 0 0" }}>Enter Marks</h1>
        </div>

        {loadError && (
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontSize: 12.5, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px" }}>
            <AlertCircle size={14} /> {loadError}
            <button onClick={loadReferenceData} style={{ marginLeft: 6, background: "none", border: "none", color: "#3b82f6", fontWeight: 600, cursor: "pointer", fontSize: 12.5 }}>Retry</button>
          </div>
        )}

        {/* ── Filter bar ────────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 20px", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const, marginBottom: selectedExam ? 18 : 0 }}>
            <FilterField label="Academic Year">
              <Select value={academicYearFilter} onChange={(v) => { setAcademicYearFilter(v); setExamId(""); }} options={academicYearOptions} placeholder="All Years" disabled={loading} />
            </FilterField>
            <FilterField label="Term">
              <Select value={termFilter} onChange={(v) => { setTermFilter(v); setExamId(""); }} options={termOptions} placeholder="All Terms" disabled={loading} />
            </FilterField>
            <FilterField label="Exam">
              <IdSelect value={examId} onChange={setExamId} options={examOptions.map((e) => ({ id: e.id, label: e.examName }))} placeholder={loading ? "Loading exams..." : "Select an exam"} disabled={loading} />
            </FilterField>
          </div>

          {selectedExam && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10 }}>
              <InfoChip label="Class" value={selectedExam.classId} />
              <InfoChip label="Stream" value={selectedExam.streamId} />
              <InfoChip label="Subject" value={selectedExam.subjectId} />
              <InfoChip label="Teacher" value={teacherName(selectedExam.teacherId)} />
              <InfoChip label="Exam Date" value={selectedExam.examDate} />
              <InfoChip label="Total Marks" value={String(selectedExam.totalMarks)} />
            </div>
          )}
        </div>

        {!selectedExam && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "60px 0", textAlign: "center" as const, color: "#94a3b8" }}>
            <Users size={28} style={{ marginBottom: 10 }} />
            <p style={{ margin: 0, fontSize: 13.5 }}>Select an exam above — the class, subject, questions, and students will load automatically.</p>
          </div>
        )}

        {selectedExam && roster && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 16, alignItems: "flex-start" }}>

            {/* ── Marks table card ────────────────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 10 }}>
                <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{selectedExam.examName} — Student Marks</p>
                {showConfigurableScale && (
                  <button onClick={() => setShowScaleEditor((p) => !p)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#334155", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    <Settings2 size={13} /> Configure Grading Scale
                  </button>
                )}
              </div>

              {showScaleEditor && showConfigurableScale && (
                <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", background: "#f8fafc" }}>
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10, marginBottom: 10 }}>
                    {gradingScale.map((band, idx) => (
                      <div key={idx} style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 8px" }}>
                        <input value={band.grade} onChange={(e) => updateGradeBand(idx, { grade: e.target.value })} style={{ width: 36, textAlign: "center" as const, border: "none", outline: "none", fontSize: 13, fontWeight: 700, color: "#3b82f6" }} />
                        <span style={{ color: "#94a3b8", fontSize: 12 }}>≥</span>
                        <input type="number" value={band.min} onChange={(e) => updateGradeBand(idx, { min: Number(e.target.value) })} style={{ width: 48, border: "none", outline: "none", fontSize: 13 }} />
                        <span style={{ color: "#94a3b8", fontSize: 12 }}>%</span>
                        <button onClick={() => removeGradeBand(idx)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", display: "flex" }}><Trash2 size={13} /></button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={addGradeBand} style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "1px solid #bfdbfe", color: "#3b82f6", borderRadius: 7, padding: "5px 10px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}><Plus size={12} /> Add Band</button>
                    <button onClick={() => setGradingScale(DEFAULT_GRADING_SCALE)} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Reset to Default</button>
                  </div>
                </div>
              )}

              {rosterError && <div style={{ padding: "12px 20px", borderBottom: "1px solid #f1f5f9" }}><div style={{ display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontSize: 12.5 }}><AlertCircle size={14} /> {rosterError}</div></div>}

              {roster.length === 0 ? (
                <div style={{ padding: "50px 0", textAlign: "center" as const, color: "#94a3b8", fontSize: 13.5 }}>
                  No students found for this exam's class/stream.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        <Th>Admission No.</Th>
                        <Th>Student</Th>
                        {usesQuestions
                          ? selectedExam.questions.map((q) => <Th key={q.number}>{`Q${q.number} (${q.marks})`}</Th>)
                          : <Th>{`Marks (/${selectedExam.totalMarks})`}</Th>}
                        <Th>Total</Th>
                        <Th>%</Th>
                        {showGrade && <Th>Grade</Th>}
                        <Th>Result</Th>
                        <Th>Remarks</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {roster.map((row) => {
                        const stats = rowStats(row);
                        return (
                          <tr key={row.studentId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <Td>{row.admissionNo}</Td>
                            <Td><span style={{ fontWeight: 600, color: "#0f172a" }}>{row.name}</span></Td>
                            {usesQuestions
                              ? selectedExam.questions.map((q) => (
                                <Td key={q.number}>
                                  <MarkInput value={row.questionMarks[q.number] ?? ""} max={q.marks} onChange={(v) => updateRow(row.studentId, { questionMarks: { ...row.questionMarks, [q.number]: v } })} />
                                </Td>
                              ))
                              : (
                                <Td>
                                  <MarkInput value={row.simpleMarks} max={selectedExam.totalMarks} onChange={(v) => updateRow(row.studentId, { simpleMarks: v })} />
                                </Td>
                              )}
                            <Td><span style={{ fontWeight: 700, color: "#0f172a" }}>{stats.total}</span></Td>
                            <Td>{stats.percentage.toFixed(1)}%</Td>
                            {showGrade && <Td><span style={{ fontWeight: 700, color: "#3b82f6" }}>{stats.grade}</span></Td>}
                            <Td><ResultBadge result={stats.result} /></Td>
                            <Td><RemarksField value={row.remarks} onChange={(v) => updateRow(row.studentId, { remarks: v })} /></Td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {roster.length > 0 && (
                <div style={{ padding: "16px 20px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 12 }}>
                  <button onClick={handleResetMarks} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#f97316", fontSize: 13, fontWeight: 600, padding: 0 }}>
                    <RotateCcw size={14} /> Reset
                  </button>
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
                    <button disabled={!!saving} onClick={() => runAction("draft")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#334155", cursor: saving ? "not-allowed" : "pointer" }}>
                      <FileText size={14} /> Save as Draft
                    </button>
                    <button disabled={!!saving} onClick={() => runAction("save")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: "1.5px solid #bfdbfe", background: "#eff6ff", fontSize: 13, fontWeight: 600, color: "#3b82f6", cursor: saving ? "not-allowed" : "pointer" }}>
                      <Save size={14} /> {isExisting ? "Update Marks" : "Save Marks"}
                    </button>
                    <button disabled={!!saving} onClick={() => runAction("submit")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                      <Send size={14} /> Submit Marks
                    </button>
                    <button disabled={!!saving} onClick={() => runAction("publish")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: saving ? "not-allowed" : "pointer" }}>
                      <Rocket size={14} /> Publish Results
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Class summary ─────────────────────────────────────────── */}
            {summary && (
              <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", position: "sticky" as const, top: 20 }}>
                <div style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", padding: "16px 18px", color: "#fff" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <BarChart2 size={16} />
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 14.5 }}>Class Summary</p>
                  </div>
                  <p style={{ margin: "4px 0 0", fontSize: 11.5, opacity: 0.85 }}>Live stats from entered marks</p>
                </div>
                <div style={{ padding: 18 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
                    <StatBox label="Average" value={`${summary.average.toFixed(1)}%`} color="#3b82f6" />
                    <StatBox label="Highest" value={`${summary.highest.toFixed(1)}%`} color="#10b981" />
                    <StatBox label="Lowest" value={`${summary.lowest.toFixed(1)}%`} color="#f59e0b" />
                    <StatBox label="Pass" value={String(summary.passCount)} color="#10b981" bg="#f0fdf4" />
                  </div>
                  <StatBox label="Failing" value={String(summary.failCount)} color="#ef4444" bg="#fef2f2" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th style={{ padding: "10px 12px", textAlign: "left" as const, color: "#94a3b8", fontWeight: 700, fontSize: 10.5, letterSpacing: "0.05em", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const }}>{children}</th>;
}
function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "10px 12px", color: "#334155" }}>{children}</td>;
}
