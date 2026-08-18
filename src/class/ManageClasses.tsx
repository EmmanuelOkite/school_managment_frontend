import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { classService } from "../api/classService";
import { streamService } from "../api/streamService";
import { studentService } from "../api/studentService";
import { teacherService } from "../api/teacherService";
import {
  Search, ChevronDown, Plus, Trash2, Pencil, MoreVertical, Users, AlertCircle,
  ArrowLeft, Power, Save, X, Layers, BookOpen, GraduationCap, Info,
  ArrowRightLeft, TrendingUp, Eye,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Person { id: string; name: string; }

interface SubjectRow {
  key: string;
  code: string;
  name: string;
  teacherId: string;
  status: "Active" | "Inactive";
}

interface ClassRow {
  id: string;
  name: string;
  code: string;
  educationLevel: string;
  academicYear: string;
  term: string;
  description: string;
  classTeacherId: string;
  assistantClassTeacherId: string;
  maxStudents: number;
  status: "Active" | "Inactive";
  subjects: SubjectRow[];
}

interface ClassDraft {
  name: string;
  code: string;
  educationLevel: string;
  academicYear: string;
  term: string;
  description: string;
  classTeacherId: string;
  assistantClassTeacherId: string;
  maxStudents: string;
  status: "Active" | "Inactive";
}

interface StreamRow {
  key: string;
  id: string | null;
  name: string;
  code: string;
  classTeacherId: string;
  room: string;
  maxStudents: string;
  status: "Active" | "Inactive";
}

interface StudentInClass {
  id: string;
  admissionNo: string;
  name: string;
  gender: string;
  stream: string;
  status: string;
  className: string;
}

interface FieldError { [key: string]: string; }

// ── Options ──────────────────────────────────────────────────────────────────

const LEVEL_OPTIONS = ["Primary", "O-Level", "A-Level"];
const TERM_OPTIONS = ["Term 1", "Term 2", "Term 3"];
const STATUS_OPTIONS: ("Active" | "Inactive")[] = ["Active", "Inactive"];
const ROWS_PER_PAGE = 10;

function academicYearOptions(): string[] {
  const y = new Date().getFullYear();
  return [String(y - 1), String(y), String(y + 1)];
}

// ── Normalizers ──────────────────────────────────────────────────────────────

function normalizeTeacher(raw: any): Person {
  return {
    id: String(raw._id ?? raw.id ?? raw.teacherId),
    name: [raw.firstName, raw.middleName, raw.lastName].filter(Boolean).join(" ").trim() || raw.name || "Unnamed Teacher",
  };
}

function normalizeClass(raw: any): ClassRow {
  const subjects = Array.isArray(raw.subjects)
    ? raw.subjects.map((s: any, i: number) => ({
        key: s._id ?? s.id ?? `subj-${i}`,
        code: s.code ?? s.subjectCode ?? "",
        name: s.name ?? s.subject ?? "",
        teacherId: String(s.teacherId ?? s.teacher?._id ?? s.teacher ?? ""),
        status: s.status === "Inactive" ? "Inactive" : "Active",
      }))
    : [];
  return {
    id: String(raw._id ?? raw.id),
    name: raw.name ?? raw.className ?? "Untitled Class",
    code: raw.code ?? raw.classCode ?? "—",
    educationLevel: raw.educationLevel ?? raw.level ?? "",
    academicYear: String(raw.academicYear ?? ""),
    term: raw.term ?? "",
    description: raw.description ?? "",
    classTeacherId: String(raw.classTeacherId ?? raw.classTeacher?._id ?? raw.classTeacher ?? ""),
    assistantClassTeacherId: String(raw.assistantClassTeacherId ?? raw.assistantClassTeacher?._id ?? raw.assistantClassTeacher ?? ""),
    maxStudents: Number(raw.maxStudents) || 0,
    status: raw.status === "Inactive" ? "Inactive" : "Active",
    subjects,
  };
}

function normalizeStream(raw: any): StreamRow {
  const id = raw._id ?? raw.id ?? null;
  return {
    key: id ? String(id) : `existing-${Math.random().toString(36).slice(2)}`,
    id: id ? String(id) : null,
    name: raw.name ?? raw.streamName ?? "",
    code: raw.code ?? raw.streamCode ?? "",
    classTeacherId: String(raw.classTeacherId ?? raw.teacherId ?? raw.classTeacher?._id ?? raw.classTeacher ?? ""),
    room: raw.room ?? "",
    maxStudents: raw.maxStudents != null ? String(raw.maxStudents) : "",
    status: raw.status === "Inactive" ? "Inactive" : "Active",
  };
}

function normalizeStudentInClass(raw: any): StudentInClass {
  const name = [raw.firstName, raw.surname ?? raw.lastName, raw.otherNames].filter(Boolean).join(" ").trim() || raw.name || "Unnamed Student";
  return {
    id: String(raw._id ?? raw.id ?? raw.studentId ?? name),
    admissionNo: String(raw.admissionNo ?? raw.admissionNumber ?? raw.studentId ?? "—"),
    name,
    gender: raw.gender ?? "—",
    className: raw.class ?? raw.className ?? raw.level ?? "—",
    stream: raw.stream ?? raw.section ?? "—",
    status: raw.status ?? "Active",
  };
}

// ── Small UI pieces ──────────────────────────────────────────────────────────

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 160 }}>
      <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "9px 32px 9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0",
          fontSize: 13, color: "#334155", background: "#fff", outline: "none",
          appearance: "none" as const, cursor: "pointer", boxSizing: "border-box" as const,
        }}
      >
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
    </div>
  );
}

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", marginBottom: 6, display: "block" }}>
      {text} {required && <span style={{ color: "#ef4444" }}>*</span>}
    </label>
  );
}

function ErrorMsg({ msg }: { msg: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 5 }}>
      <AlertCircle size={12} color="#ef4444" />
      <span style={{ fontSize: 11.5, color: "#ef4444" }}>{msg}</span>
    </div>
  );
}

function InputField({
  placeholder, value, onChange, error, type = "text", readOnly = false, icon,
}: { placeholder: string; value: string; onChange: (v: string) => void; error?: string; type?: string; readOnly?: boolean; icon?: React.ReactNode }) {
  return (
    <div style={{ position: "relative" }}>
      {icon && <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none", display: "flex" }}>{icon}</div>}
      <input
        type={type}
        value={value}
        readOnly={readOnly}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: icon ? "10px 14px 10px 36px" : "10px 14px", borderRadius: 8,
          border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
          fontSize: 13.5, color: readOnly ? "#94a3b8" : "#0f172a", background: readOnly ? "#f8fafc" : "#fff",
          outline: "none", boxSizing: "border-box" as const, fontStyle: readOnly ? "italic" : "normal",
        }}
      />
    </div>
  );
}

function SelectField({
  placeholder, value, onChange, options, error, disabled = false,
}: { placeholder: string; value: string; onChange: (v: string) => void; options: string[]; error?: string; disabled?: boolean }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 34px 10px 14px", borderRadius: 8,
          border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
          fontSize: 13.5, color: value ? "#0f172a" : "#94a3b8", background: disabled ? "#f8fafc" : "#fff",
          outline: "none", appearance: "none" as const, cursor: disabled ? "not-allowed" : "pointer", boxSizing: "border-box" as const,
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
    </div>
  );
}

function PersonSelect({
  placeholder, value, onChange, options, error, disabled = false,
}: { placeholder: string; value: string; onChange: (id: string) => void; options: Person[]; error?: string; disabled?: boolean }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 34px 10px 14px", borderRadius: 8,
          border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
          fontSize: 13.5, color: value ? "#0f172a" : "#94a3b8", background: disabled ? "#f8fafc" : "#fff",
          outline: "none", appearance: "none" as const, cursor: disabled ? "not-allowed" : "pointer", boxSizing: "border-box" as const,
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
      </select>
      <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
    </div>
  );
}

function TextArea({ placeholder, value, onChange }: { placeholder: string; value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={2}
      style={{
        width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0",
        fontSize: 13.5, color: "#0f172a", background: "#fff", outline: "none",
        resize: "vertical" as const, boxSizing: "border-box" as const, fontFamily: "inherit",
      }}
    />
  );
}

function StatusPill({ status }: { status: "Active" | "Inactive" }) {
  const active = status === "Active";
  return (
    <span style={{
      fontSize: 10.5, fontWeight: 700, letterSpacing: "0.03em", textTransform: "uppercase" as const,
      padding: "3px 9px", borderRadius: 20, color: active ? "#10b981" : "#94a3b8", background: active ? "#f0fdf4" : "#f1f5f9",
    }}>
      {status}
    </span>
  );
}

function ModalShell({
  title, onClose, children, width = 440,
}: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 1000 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: width, maxHeight: "85vh", overflowY: "auto", background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{title}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}>
      <span style={{ color: "#94a3b8" }}>{label}</span>
      <span style={{ color: "#0f172a", fontWeight: 600, textAlign: "right" as const }}>{value}</span>
    </div>
  );
}

// ── Row actions menu (classes table) ────────────────────────────────────────

type ActionKind = "view" | "edit" | "streams" | "subjects" | "students" | "assignTeacher" | "promote" | "toggleStatus" | "delete";

function ClassActionsMenu({ cls, onAction }: { cls: ClassRow; onAction: (kind: ActionKind) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const items: { kind: ActionKind; label: string; icon: React.ReactNode; danger?: boolean }[] = [
    { kind: "view", label: "View Class", icon: <Eye size={13} /> },
    { kind: "edit", label: "Edit Class", icon: <Pencil size={13} /> },
    { kind: "streams", label: "Manage Streams", icon: <Layers size={13} /> },
    { kind: "subjects", label: "Assign Subjects", icon: <BookOpen size={13} /> },
    { kind: "students", label: "View Students", icon: <GraduationCap size={13} /> },
    { kind: "assignTeacher", label: "Assign Teacher", icon: <Users size={13} /> },
    { kind: "promote", label: "Promote Students", icon: <TrendingUp size={13} /> },
    { kind: "toggleStatus", label: cls.status === "Active" ? "Deactivate Class" : "Activate Class", icon: <Power size={13} />, danger: cls.status === "Active" },
  ];

  return (
    <div ref={ref} style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen((p) => !p)} title="Actions" style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 4 }}>
        <MoreVertical size={16} />
      </button>
      {open && (
        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 200, zIndex: 60, overflow: "hidden" }}>
          {items.map((item) => (
            <button key={item.kind} onClick={() => { setOpen(false); onAction(item.kind); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "9px 14px", background: "none", border: "none", cursor: "pointer", fontSize: 13, color: item.danger ? "#ef4444" : "#334155", textAlign: "left" as const }}>
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Stream row (editable) ───────────────────────────────────────────────────

function StreamTableRow({
  row, error, teachers, onChange, onDelete,
}: { row: StreamRow; error?: string; teachers: Person[]; onChange: (patch: Partial<StreamRow>) => void; onDelete: () => void }) {
  const cell: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid #f1f5f9" };
  const input: React.CSSProperties = { width: "100%", padding: "7px 9px", borderRadius: 7, border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`, fontSize: 12.5, color: "#0f172a", outline: "none", boxSizing: "border-box" as const };
  return (
    <tr style={{ opacity: row.status === "Inactive" ? 0.55 : 1 }}>
      <td style={{ ...cell, width: 180 }}><input value={row.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="e.g. East" style={input} /></td>
      <td style={{ ...cell, width: 110 }}><input value={row.code} onChange={(e) => onChange({ code: e.target.value })} placeholder="e.g. S2-E" style={input} /></td>
      <td style={{ ...cell, width: 190 }}>
        <div style={{ position: "relative" }}>
          <select value={row.classTeacherId} onChange={(e) => onChange({ classTeacherId: e.target.value })} style={{ ...input, appearance: "none" as const, cursor: "pointer", paddingRight: 24, color: row.classTeacherId ? "#0f172a" : "#94a3b8" }}>
            <option value="">Unassigned</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <ChevronDown size={12} style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
        </div>
      </td>
      <td style={{ ...cell, width: 110 }}><input value={row.room} onChange={(e) => onChange({ room: e.target.value })} placeholder="Room" style={input} /></td>
      <td style={{ ...cell, width: 90 }}><input type="number" value={row.maxStudents} onChange={(e) => onChange({ maxStudents: e.target.value })} placeholder="40" style={input} /></td>
      <td style={{ ...cell, width: 70, textAlign: "center" as const }}>
        <button onClick={() => onChange({ status: row.status === "Active" ? "Inactive" : "Active" })} title={row.status === "Active" ? "Deactivate stream" : "Activate stream"} style={{ background: "none", border: "none", cursor: "pointer", color: row.status === "Active" ? "#10b981" : "#94a3b8", display: "inline-flex" }}>
          <Power size={14} />
        </button>
      </td>
      <td style={{ ...cell, width: 40, textAlign: "center" as const }}>
        <button onClick={onDelete} title="Delete stream" style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", display: "inline-flex" }}><Trash2 size={14} /></button>
      </td>
    </tr>
  );
}

// ── Subject row (editable) ──────────────────────────────────────────────────

function SubjectTableRow({
  row, teachers, onChange, onDelete,
}: { row: SubjectRow; teachers: Person[]; onChange: (patch: Partial<SubjectRow>) => void; onDelete: () => void }) {
  const cell: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid #f1f5f9" };
  const input: React.CSSProperties = { width: "100%", padding: "7px 9px", borderRadius: 7, border: "1.5px solid #e2e8f0", fontSize: 12.5, color: "#0f172a", outline: "none", boxSizing: "border-box" as const };
  return (
    <tr style={{ opacity: row.status === "Inactive" ? 0.55 : 1 }}>
      <td style={{ ...cell, width: 110 }}><input value={row.code} onChange={(e) => onChange({ code: e.target.value })} placeholder="e.g. MAT" style={{ ...input, fontWeight: 700, color: "#3b82f6" }} /></td>
      <td style={{ ...cell, minWidth: 180 }}><input value={row.name} onChange={(e) => onChange({ name: e.target.value })} placeholder="e.g. Mathematics" style={input} /></td>
      <td style={{ ...cell, width: 200 }}>
        <div style={{ position: "relative" }}>
          <select value={row.teacherId} onChange={(e) => onChange({ teacherId: e.target.value })} style={{ ...input, appearance: "none" as const, cursor: "pointer", paddingRight: 24, color: row.teacherId ? "#0f172a" : "#94a3b8" }}>
            <option value="">Unassigned</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <ChevronDown size={12} style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
        </div>
      </td>
      <td style={{ ...cell, width: 90, textAlign: "center" as const }}>
        <button onClick={() => onChange({ status: row.status === "Active" ? "Inactive" : "Active" })} style={{ background: "none", border: "none", cursor: "pointer" }}>
          <StatusPill status={row.status} />
        </button>
      </td>
      <td style={{ ...cell, width: 40, textAlign: "center" as const }}>
        <button onClick={onDelete} title="Remove subject" style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", display: "inline-flex" }}><Trash2 size={14} /></button>
      </td>
    </tr>
  );
}

// ── Class detail view ────────────────────────────────────────────────────────

type Tab = "overview" | "streams" | "subjects" | "students";

function ClassDetail({
  cls, teachers, allStudents, initialTab, initialPromote, onBack, onClassUpdated, onClassDeactivated,
}: {
  cls: ClassRow; teachers: Person[]; allStudents: StudentInClass[]; initialTab: Tab; initialPromote?: boolean;
  onBack: () => void;
  onClassUpdated: (updated: ClassRow) => void;
  onClassDeactivated: (id: string, status: "Active" | "Inactive") => void;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);

  // Overview
  const [draft, setDraft] = useState<ClassDraft>({
    name: cls.name, code: cls.code, educationLevel: cls.educationLevel, academicYear: cls.academicYear, term: cls.term,
    description: cls.description, classTeacherId: cls.classTeacherId, assistantClassTeacherId: cls.assistantClassTeacherId,
    maxStudents: String(cls.maxStudents || ""), status: cls.status,
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [savingOverview, setSavingOverview] = useState(false);

  // Streams
  const [streams, setStreams] = useState<StreamRow[]>([]);
  const [loadingStreams, setLoadingStreams] = useState(true);
  const [streamsError, setStreamsError] = useState<string | null>(null);
  const [savingStreams, setSavingStreams] = useState(false);
  const nextStreamKey = useRef(1);

  // Subjects
  const [subjects, setSubjects] = useState<SubjectRow[]>(cls.subjects);
  const [savingSubjects, setSavingSubjects] = useState(false);
  const nextSubjectKey = useRef(1);

  // Students
  const studentsInClass = useMemo(() => allStudents.filter((s) => s.className === cls.name), [allStudents, cls.name]);
  const [promoteMode, setPromoteMode] = useState(!!initialPromote);
  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  const [promoteTarget, setPromoteTarget] = useState("");
  const [promoting, setPromoting] = useState(false);
  const [transferStudent, setTransferStudent] = useState<StudentInClass | null>(null);
  const [profileStudent, setProfileStudent] = useState<StudentInClass | null>(null);

  const loadStreams = () => {
    setLoadingStreams(true);
    setStreamsError(null);
    streamService.getForClass(cls.id)
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.streams ?? res.data?.data ?? [];
        setStreams(raw.map(normalizeStream));
      })
      .catch((err) => setStreamsError(err.response?.data?.message ?? "Failed to load streams for this class."))
      .finally(() => setLoadingStreams(false));
  };

  useEffect(() => { loadStreams(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [cls.id]);

  const setField = (field: keyof ClassDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateOverview = (): boolean => {
    const e: FieldError = {};
    if (!draft.name.trim()) e.name = "Class name is required";
    if (!draft.code.trim()) e.code = "Class code is required";
    if (!draft.educationLevel) e.educationLevel = "Please select an education level";
    if (!draft.classTeacherId) e.classTeacherId = "Please select a class teacher";
    if (!draft.maxStudents || Number(draft.maxStudents) <= 0) e.maxStudents = "Enter a valid maximum student count";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const saveOverview = async () => {
    if (!validateOverview()) return;
    setSavingOverview(true);
    try {
      const payload = {
        name: draft.name.trim(), code: draft.code.trim().toUpperCase(), educationLevel: draft.educationLevel,
        academicYear: draft.academicYear, term: draft.term, description: draft.description.trim(),
        classTeacherId: draft.classTeacherId, assistantClassTeacherId: draft.assistantClassTeacherId || undefined,
        maxStudents: Number(draft.maxStudents), status: draft.status,
      };
      await classService.update(cls.id, payload);
      onClassUpdated({ ...cls, ...payload, assistantClassTeacherId: draft.assistantClassTeacherId, subjects: cls.subjects });
      alert("Class details saved.");
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to save class details.");
    } finally {
      setSavingOverview(false);
    }
  };

  const addStreamRow = () => setStreams((prev) => [...prev, {
    key: `new-${nextStreamKey.current++}`, id: null, name: "", code: "", classTeacherId: "", room: "", maxStudents: "", status: "Active",
  }]);
  const updateStreamRow = (key: string, patch: Partial<StreamRow>) => setStreams((prev) => prev.map((r) => r.key === key ? { ...r, ...patch } : r));
  const deleteStreamRow = (row: StreamRow) => {
    if (row.id) {
      if (!window.confirm(`Delete stream "${row.name || row.key}"? This cannot be undone.`)) return;
      streamService.delete(row.id)
        .then(() => setStreams((prev) => prev.filter((r) => r.key !== row.key)))
        .catch((err: any) => alert(err.response?.data?.message ?? "Failed to delete stream."));
    } else {
      setStreams((prev) => prev.filter((r) => r.key !== row.key));
    }
  };
  const saveStreams = async () => {
    setSavingStreams(true);
    try {
      await streamService.bulkSave(cls.id, streams.map((s) => ({
        id: s.id ?? undefined, name: s.name.trim(), code: s.code.trim(), classTeacherId: s.classTeacherId || undefined,
        room: s.room.trim(), maxStudents: Number(s.maxStudents) || 0, status: s.status,
      })));
      alert("Streams saved.");
      loadStreams();
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to save streams.");
    } finally {
      setSavingStreams(false);
    }
  };

  const addSubjectRow = () => setSubjects((prev) => [...prev, { key: `new-${nextSubjectKey.current++}`, code: "", name: "", teacherId: "", status: "Active" }]);
  const updateSubjectRow = (key: string, patch: Partial<SubjectRow>) => setSubjects((prev) => prev.map((r) => r.key === key ? { ...r, ...patch } : r));
  const deleteSubjectRow = (key: string) => setSubjects((prev) => prev.filter((r) => r.key !== key));
  const saveSubjects = async () => {
    setSavingSubjects(true);
    try {
      const payload = subjects.map((s) => ({ code: s.code.trim(), name: s.name.trim(), teacherId: s.teacherId || undefined, status: s.status }));
      await classService.update(cls.id, { subjects: payload });
      onClassUpdated({ ...cls, subjects });
      alert("Subjects saved.");
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to save subjects.");
    } finally {
      setSavingSubjects(false);
    }
  };

  const toggleSelectStudent = (id: string) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handlePromote = async () => {
    if (!promoteTarget.trim() || selectedStudentIds.size === 0) return;
    setPromoting(true);
    try {
      await Promise.all(Array.from(selectedStudentIds).map((id) => studentService.update(id, { class: promoteTarget.trim() })));
      alert(`Promoted ${selectedStudentIds.size} student(s) to ${promoteTarget.trim()}.`);
      setSelectedStudentIds(new Set());
      setPromoteMode(false);
      setPromoteTarget("");
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to promote some students.");
    } finally {
      setPromoting(false);
    }
  };

  const teacherName = (id: string) => teachers.find((t) => t.id === id)?.name ?? "Unassigned";

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <Info size={13} /> },
    { key: "streams", label: "Streams", icon: <Layers size={13} /> },
    { key: "subjects", label: "Subjects", icon: <BookOpen size={13} /> },
    { key: "students", label: "Students", icon: <GraduationCap size={13} /> },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexWrap: "wrap" as const, gap: 12 }}>
        <div>
          <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#3b82f6", fontSize: 12.5, fontWeight: 600, padding: 0, marginBottom: 8 }}>
            <ArrowLeft size={14} /> Back to Classes
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>{cls.name}</h1>
            <StatusPill status={cls.status} />
          </div>
          <p style={{ margin: "4px 0 0", fontSize: 12.5, color: "#94a3b8" }}>
            {cls.code} · {cls.educationLevel || "—"} · {cls.academicYear || "—"}{cls.term ? ` · ${cls.term}` : ""} · Class Teacher: {teacherName(cls.classTeacherId)}
          </p>
        </div>
        <button
          onClick={() => { if (window.confirm(`${cls.status === "Active" ? "Deactivate" : "Activate"} ${cls.name}?`)) onClassDeactivated(cls.id, cls.status === "Active" ? "Inactive" : "Active"); }}
          style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: `1.5px solid ${cls.status === "Active" ? "#fecaca" : "#e2e8f0"}`, background: "#fff", fontSize: 13, fontWeight: 600, color: cls.status === "Active" ? "#ef4444" : "#334155", cursor: "pointer" }}
        >
          <Power size={14} /> {cls.status === "Active" ? "Deactivate Class" : "Activate Class"}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, borderBottom: "1px solid #e2e8f0" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", background: "none", border: "none",
              borderBottom: tab === t.key ? "2px solid #3b82f6" : "2px solid transparent",
              color: tab === t.key ? "#3b82f6" : "#64748b", fontSize: 13, fontWeight: 600, cursor: "pointer", marginBottom: -1,
            }}
          >
            {t.icon} {t.label}
            {t.key === "streams" && <span style={{ background: "#f1f5f9", color: "#64748b", fontSize: 10.5, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>{streams.length}</span>}
            {t.key === "subjects" && <span style={{ background: "#f1f5f9", color: "#64748b", fontSize: 10.5, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>{subjects.length}</span>}
            {t.key === "students" && <span style={{ background: "#f1f5f9", color: "#64748b", fontSize: 10.5, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>{studentsInClass.length}</span>}
          </button>
        ))}
      </div>

      {/* ── Overview tab ─────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
            <div>
              <Label text="Class Name" required />
              <InputField placeholder="e.g. Senior 1" value={draft.name} onChange={(v) => setField("name", v)} error={errors.name} />
              {errors.name && <ErrorMsg msg={errors.name} />}
            </div>
            <div>
              <Label text="Class Code" required />
              <InputField placeholder="e.g. S1" value={draft.code} onChange={(v) => setField("code", v)} error={errors.code} />
              {errors.code && <ErrorMsg msg={errors.code} />}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginBottom: 18 }}>
            <div>
              <Label text="Education Level" required />
              <SelectField placeholder="Select level" value={draft.educationLevel} onChange={(v) => setField("educationLevel", v)} options={LEVEL_OPTIONS} error={errors.educationLevel} />
              {errors.educationLevel && <ErrorMsg msg={errors.educationLevel} />}
            </div>
            <div>
              <Label text="Academic Year" />
              <SelectField placeholder="Select year" value={draft.academicYear} onChange={(v) => setField("academicYear", v)} options={academicYearOptions()} />
            </div>
            <div>
              <Label text="Term" />
              <SelectField placeholder="Select term" value={draft.term} onChange={(v) => setField("term", v)} options={TERM_OPTIONS} />
            </div>
          </div>
          <div style={{ marginBottom: 18 }}>
            <Label text="Description" />
            <TextArea placeholder="Optional notes..." value={draft.description} onChange={(v) => setField("description", v)} />
          </div>

          <div style={{ height: 1, background: "#f1f5f9", margin: "20px 0" }} />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
            <div>
              <Label text="Class Teacher" required />
              <PersonSelect placeholder="Select class teacher" value={draft.classTeacherId} onChange={(v) => setField("classTeacherId", v)} options={teachers} error={errors.classTeacherId} />
              {errors.classTeacherId && <ErrorMsg msg={errors.classTeacherId} />}
            </div>
            <div>
              <Label text="Assistant Class Teacher" />
              <PersonSelect placeholder="Optional" value={draft.assistantClassTeacherId} onChange={(v) => setField("assistantClassTeacherId", v)} options={teachers} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginBottom: 8 }}>
            <div>
              <Label text="Maximum Students" required />
              <InputField placeholder="e.g. 120" value={draft.maxStudents} onChange={(v) => setField("maxStudents", v)} type="number" error={errors.maxStudents} />
              {errors.maxStudents && <ErrorMsg msg={errors.maxStudents} />}
            </div>
            <div>
              <Label text="Current Student Count" />
              <InputField placeholder="Auto-calculated" value={String(studentsInClass.length)} onChange={() => {}} icon={<Users size={14} />} readOnly />
            </div>
            <div>
              <Label text="Status" />
              <SelectField placeholder="Select status" value={draft.status} onChange={(v) => setField("status", v as "Active" | "Inactive")} options={STATUS_OPTIONS} />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <button onClick={saveOverview} disabled={savingOverview} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 22px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: savingOverview ? "not-allowed" : "pointer" }}>
              <Save size={14} /> {savingOverview ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* ── Streams tab ──────────────────────────────────────────────────── */}
      {tab === "streams" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>Streams belonging to {cls.name}</p>
            <button onClick={addStreamRow} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#3b82f6", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={13} /> Add Stream
            </button>
          </div>

          {streamsError && <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontSize: 12.5, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px" }}><AlertCircle size={13} /> {streamsError}</div>}

          {loadingStreams ? (
            <div style={{ padding: "30px 0", textAlign: "center" as const, color: "#94a3b8", fontSize: 13 }}>Loading streams…</div>
          ) : streams.length === 0 ? (
            <div style={{ padding: "26px 0", textAlign: "center" as const, color: "#94a3b8", border: "1.5px dashed #e2e8f0", borderRadius: 10 }}>
              <p style={{ margin: 0, fontSize: 12.5 }}>No streams yet — e.g. {cls.name} East, {cls.name} West, {cls.name} North.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 10 }}>
              <table style={{ width: 790, tableLayout: "fixed" as const, borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Stream Name", "Code", "Class Teacher", "Room", "Max", "Status", ""].map((h) => (
                      <th key={h} style={{ padding: "10px 10px", textAlign: "left" as const, color: "#94a3b8", fontWeight: 700, fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {streams.map((row) => (
                    <StreamTableRow key={row.key} row={row} teachers={teachers} onChange={(patch) => updateStreamRow(row.key, patch)} onDelete={() => deleteStreamRow(row)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <button onClick={saveStreams} disabled={savingStreams} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 22px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: savingStreams ? "not-allowed" : "pointer" }}>
              <Save size={14} /> {savingStreams ? "Saving…" : "Save Streams"}
            </button>
          </div>
        </div>
      )}

      {/* ── Subjects tab ─────────────────────────────────────────────────── */}
      {tab === "subjects" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>Subjects offered to {cls.name}</p>
            <button onClick={addSubjectRow} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#3b82f6", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
              <Plus size={13} /> Add Subject
            </button>
          </div>

          {subjects.length === 0 ? (
            <div style={{ padding: "26px 0", textAlign: "center" as const, color: "#94a3b8", border: "1.5px dashed #e2e8f0", borderRadius: 10 }}>
              <p style={{ margin: 0, fontSize: 12.5 }}>No subjects assigned yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 10 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["Code", "Subject", "Teacher (Assign)", "Status", ""].map((h) => (
                      <th key={h} style={{ padding: "10px 10px", textAlign: "left" as const, color: "#94a3b8", fontWeight: 700, fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {subjects.map((row) => (
                    <SubjectTableRow key={row.key} row={row} teachers={teachers} onChange={(patch) => updateSubjectRow(row.key, patch)} onDelete={() => deleteSubjectRow(row.key)} />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 18 }}>
            <button onClick={saveSubjects} disabled={savingSubjects} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 22px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: savingSubjects ? "not-allowed" : "pointer" }}>
              <Save size={14} /> {savingSubjects ? "Saving…" : "Save Subjects"}
            </button>
          </div>
        </div>
      )}

      {/* ── Students tab ─────────────────────────────────────────────────── */}
      {tab === "students" && (
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: 22 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap" as const, gap: 10 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>
              {studentsInClass.length} student{studentsInClass.length === 1 ? "" : "s"} enrolled{cls.maxStudents ? ` · capacity ${cls.maxStudents}` : ""} <span style={{ fontStyle: "italic", color: "#cbd5e1" }}>(calculated automatically)</span>
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => window.location.assign("/students/add")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#3b82f6", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <Plus size={13} /> Add Student
              </button>
              <button onClick={() => { setPromoteMode((p) => !p); setSelectedStudentIds(new Set()); }} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, border: "1px solid #e2e8f0", background: promoteMode ? "#f1f5f9" : "#fff", color: "#334155", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                <TrendingUp size={13} /> {promoteMode ? "Cancel Promote" : "Promote Students"}
              </button>
            </div>
          </div>

          {promoteMode && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 16, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, flexWrap: "wrap" as const }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <Label text={`Promote ${selectedStudentIds.size} selected student(s) to`} />
                <InputField placeholder="e.g. Senior 2" value={promoteTarget} onChange={setPromoteTarget} />
              </div>
              <button onClick={handlePromote} disabled={promoting || !promoteTarget.trim() || selectedStudentIds.size === 0} style={{ padding: "10px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: promoting ? "not-allowed" : "pointer" }}>
                {promoting ? "Promoting…" : "Confirm Promotion"}
              </button>
            </div>
          )}

          {studentsInClass.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center" as const, color: "#94a3b8" }}>
              <GraduationCap size={24} style={{ marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 13 }}>No students in this class yet.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    {promoteMode && <th style={{ padding: "10px 10px", width: 36 }} />}
                    {["Admission No.", "Student Name", "Gender", "Stream", "Status", ""].map((h) => (
                      <th key={h} style={{ padding: "10px 10px", textAlign: "left" as const, color: "#94a3b8", fontWeight: 700, fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studentsInClass.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      {promoteMode && (
                        <td style={{ padding: "10px 10px" }}>
                          <input type="checkbox" checked={selectedStudentIds.has(s.id)} onChange={() => toggleSelectStudent(s.id)} />
                        </td>
                      )}
                      <td style={{ padding: "10px 10px", color: "#3b82f6", fontWeight: 600 }}>{s.admissionNo}</td>
                      <td style={{ padding: "10px 10px", color: "#0f172a", fontWeight: 600 }}>{s.name}</td>
                      <td style={{ padding: "10px 10px", color: "#334155" }}>{s.gender}</td>
                      <td style={{ padding: "10px 10px", color: "#334155" }}>{s.stream}</td>
                      <td style={{ padding: "10px 10px" }}>{s.status}</td>
                      <td style={{ padding: "10px 10px", textAlign: "right" as const }}>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                          <button onClick={() => setProfileStudent(s)} title="View profile" style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}><Eye size={14} /></button>
                          <button onClick={() => setTransferStudent(s)} title="Transfer student" style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}><ArrowRightLeft size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {profileStudent && (
        <ModalShell title="Student Profile" onClose={() => setProfileStudent(null)} width={400}>
          <InfoRow label="Admission No." value={profileStudent.admissionNo} />
          <InfoRow label="Name" value={profileStudent.name} />
          <InfoRow label="Gender" value={profileStudent.gender} />
          <InfoRow label="Class" value={profileStudent.className} />
          <InfoRow label="Stream" value={profileStudent.stream} />
          <InfoRow label="Status" value={profileStudent.status} />
        </ModalShell>
      )}

      {transferStudent && (
        <TransferStudentModal
          student={transferStudent}
          onClose={() => setTransferStudent(null)}
          onTransferred={() => setTransferStudent(null)}
        />
      )}
    </div>
  );
}

function TransferStudentModal({ student, onClose, onTransferred }: { student: StudentInClass; onClose: () => void; onTransferred: () => void }) {
  const [targetClass, setTargetClass] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!targetClass.trim()) return;
    setSaving(true);
    try {
      await studentService.update(student.id, { class: targetClass.trim() });
      alert(`${student.name} transferred to ${targetClass.trim()}.`);
      onTransferred();
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to transfer student.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Transfer Student" onClose={onClose} width={400}>
      <p style={{ fontSize: 13, color: "#64748b", marginTop: 0 }}>Move <strong>{student.name}</strong> ({student.admissionNo}) from <strong>{student.className}</strong> to a new class.</p>
      <div style={{ marginBottom: 18 }}>
        <Label text="New Class" required />
        <InputField placeholder="e.g. Senior 2" value={targetClass} onChange={setTargetClass} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#334155", cursor: "pointer" }}>Cancel</button>
        <button disabled={saving || !targetClass.trim()} onClick={handleSave} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Transferring..." : "Transfer"}
        </button>
      </div>
    </ModalShell>
  );
}

function AssignTeacherModal({ cls, teachers, onClose, onSaved }: { cls: ClassRow; teachers: Person[]; onClose: () => void; onSaved: (teacherId: string) => void }) {
  const [teacherId, setTeacherId] = useState(cls.classTeacherId);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!teacherId) return;
    setSaving(true);
    try {
      await classService.update(cls.id, { classTeacherId: teacherId });
      onSaved(teacherId);
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to assign teacher.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title={`Assign Teacher — ${cls.name}`} onClose={onClose} width={400}>
      <div style={{ marginBottom: 18 }}>
        <Label text="Class Teacher" required />
        <PersonSelect placeholder="Select teacher" value={teacherId} onChange={setTeacherId} options={teachers} />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#334155", cursor: "pointer" }}>Cancel</button>
        <button disabled={saving || !teacherId} onClick={handleSave} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Saving..." : "Assign"}
        </button>
      </div>
    </ModalShell>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ManageClasses({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();

  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [classesError, setClassesError] = useState<string | null>(null);

  const [teachers, setTeachers] = useState<Person[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  const [students, setStudents] = useState<StudentInClass[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);

  const [streamCounts, setStreamCounts] = useState<Record<string, number>>({});

  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("All Levels");
  const [yearFilter, setYearFilter] = useState("All Years");
  const [statusFilter, setStatusFilter] = useState("All Status");
  const [teacherFilter, setTeacherFilter] = useState("All Teachers");
  const [page, setPage] = useState(1);

  const [selected, setSelected] = useState<{ id: string; tab: Tab; promote?: boolean } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [assignTeacherFor, setAssignTeacherFor] = useState<ClassRow | null>(null);

  const loadClasses = () => {
    setLoadingClasses(true);
    setClassesError(null);
    classService.getAll()
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.classes ?? res.data?.data ?? [];
        const normalized: ClassRow[] = raw.map(normalizeClass);
        setClasses(normalized);
        Promise.allSettled(normalized.map((c) => streamService.getForClass(c.id)))
          .then((results) => {
            const counts: Record<string, number> = {};
            results.forEach((r, i) => {
              if (r.status !== "fulfilled") return;
              const rawStreams = Array.isArray(r.value.data) ? r.value.data : r.value.data?.streams ?? r.value.data?.data ?? [];
              counts[normalized[i].id] = rawStreams.length;
            });
            setStreamCounts(counts);
          });
      })
      .catch((err) => setClassesError(err.response?.data?.message ?? "Failed to load classes."))
      .finally(() => setLoadingClasses(false));
  };

  useEffect(() => {
    loadClasses();
    teacherService.getAll()
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.teachers ?? res.data?.data ?? [];
        setTeachers(raw.map(normalizeTeacher));
      })
      .catch(() => { /* teacher names fall back to "Unassigned" below */ })
      .finally(() => setLoadingTeachers(false));
    studentService.getAll()
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.students ?? res.data?.data ?? [];
        setStudents(raw.map(normalizeStudentInClass));
      })
      .catch(() => { /* student counts fall back to 0 below */ })
      .finally(() => setLoadingStudents(false));
  }, []);

  const teacherName = (id: string) => teachers.find((t) => t.id === id)?.name ?? "Unassigned";
  const studentCountFor = (className: string) => students.filter((s) => s.className === className).length;

  const levelOptions = useMemo(() => ["All Levels", ...Array.from(new Set(classes.map((c) => c.educationLevel).filter(Boolean)))], [classes]);
  const yearOptions = useMemo(() => ["All Years", ...Array.from(new Set(classes.map((c) => c.academicYear).filter(Boolean)))], [classes]);
  const teacherOptions = useMemo(() => ["All Teachers", ...Array.from(new Set(classes.map((c) => teacherName(c.classTeacherId)).filter((n) => n !== "Unassigned")))], [classes, teachers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return classes.filter((c) => {
      if (levelFilter !== "All Levels" && c.educationLevel !== levelFilter) return false;
      if (yearFilter !== "All Years" && c.academicYear !== yearFilter) return false;
      if (statusFilter !== "All Status" && c.status !== statusFilter) return false;
      if (teacherFilter !== "All Teachers" && teacherName(c.classTeacherId) !== teacherFilter) return false;
      if (q && !c.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [classes, search, levelFilter, yearFilter, statusFilter, teacherFilter, teachers]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * ROWS_PER_PAGE, (currentPage - 1) * ROWS_PER_PAGE + ROWS_PER_PAGE);

  const clearFilters = () => {
    setSearch(""); setLevelFilter("All Levels"); setYearFilter("All Years"); setStatusFilter("All Status"); setTeacherFilter("All Teachers"); setPage(1);
  };

  const handleToggleStatus = (id: string, newStatus: "Active" | "Inactive") => {
    setBusyId(id);
    classService.update(id, { status: newStatus })
      .then(() => setClasses((prev) => prev.map((c) => c.id === id ? { ...c, status: newStatus } : c)))
      .catch((err: any) => alert(err.response?.data?.message ?? "Failed to update class status."))
      .finally(() => setBusyId(null));
  };

  const handleAction = (cls: ClassRow, kind: ActionKind) => {
    if (kind === "toggleStatus") {
      if (window.confirm(`${cls.status === "Active" ? "Deactivate" : "Activate"} ${cls.name}?`)) handleToggleStatus(cls.id, cls.status === "Active" ? "Inactive" : "Active");
      return;
    }
    if (kind === "assignTeacher") { setAssignTeacherFor(cls); return; }
    const tabByKind: Partial<Record<ActionKind, Tab>> = { view: "overview", edit: "overview", streams: "streams", subjects: "subjects", students: "students", promote: "students" };
    const tab = tabByKind[kind] ?? "overview";
    setSelected({ id: cls.id, tab, promote: kind === "promote" });
  };

  const selectedClass = selected ? classes.find((c) => c.id === selected.id) : null;

  if (selectedClass && selected) {
    return (
      <div style={{ minHeight: embedded ? undefined : "100vh", background: embedded ? "transparent" : "#f1f5f9", padding: embedded ? "20px" : "28px 28px", fontFamily: "'Inter', 'Segoe UI', sans-serif", textAlign: "left" as const }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <ClassDetail
            cls={selectedClass}
            teachers={teachers}
            allStudents={students}
            initialTab={selected.tab}
            initialPromote={!!selected.promote}
            onBack={() => setSelected(null)}
            onClassUpdated={(updated) => setClasses((prev) => prev.map((c) => c.id === updated.id ? updated : c))}
            onClassDeactivated={(id, status) => { handleToggleStatus(id, status); setSelected(null); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: embedded ? undefined : "100vh", background: embedded ? "transparent" : "#f1f5f9", padding: embedded ? "20px" : "28px 28px", fontFamily: "'Inter', 'Segoe UI', sans-serif", textAlign: "left" as const }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap" as const, gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12.5, color: "#94a3b8" }}>Academic Management <span style={{ margin: "0 4px" }}>›</span> Manage Classes</p>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "4px 0 0" }}>Manage Classes</h1>
          </div>
          <button onClick={() => navigate("/classes/add")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            <Plus size={15} /> Add Class
          </button>
        </div>

        {/* ── Filter bar ────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 10, alignItems: "flex-end", marginBottom: 18, flexWrap: "wrap" as const }}>
          <div style={{ flex: 1.4, minWidth: 220 }}>
            <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 6 }}>Search Class Name</label>
            <div style={{ position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="e.g. Senior 1"
                style={{ width: "100%", padding: "9px 14px 9px 34px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#334155", background: "#fff", outline: "none", boxSizing: "border-box" as const }}
              />
            </div>
          </div>
          <FilterField label="Education Level"><FilterSelect value={levelFilter} onChange={(v) => { setLevelFilter(v); setPage(1); }} options={levelOptions} /></FilterField>
          <FilterField label="Academic Year"><FilterSelect value={yearFilter} onChange={(v) => { setYearFilter(v); setPage(1); }} options={yearOptions} /></FilterField>
          <FilterField label="Status"><FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={statusOptionsWithAll()} /></FilterField>
          <FilterField label="Class Teacher"><FilterSelect value={teacherFilter} onChange={(v) => { setTeacherFilter(v); setPage(1); }} options={teacherOptions} /></FilterField>
          <button onClick={clearFilters} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: "9px 0" }}>Clear Filters</button>
        </div>

        {classesError && (
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontSize: 12.5, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px" }}>
            <AlertCircle size={14} /> {classesError}
            <button onClick={loadClasses} style={{ marginLeft: 6, background: "none", border: "none", color: "#3b82f6", fontWeight: 600, cursor: "pointer", fontSize: 12.5 }}>Retry</button>
          </div>
        )}

        {/* ── Table card ────────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
          {loadingClasses && <div style={{ padding: "60px 0", textAlign: "center" as const, color: "#94a3b8", fontSize: 13.5 }}>Loading classes…</div>}

          {!loadingClasses && !classesError && filtered.length === 0 && (
            <div style={{ padding: "60px 0", textAlign: "center" as const, color: "#94a3b8" }}>
              <GraduationCap size={28} style={{ marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 13.5 }}>{classes.length === 0 ? "No classes created yet — add one to get started." : "No classes match your filters."}</p>
            </div>
          )}

          {!loadingClasses && !classesError && filtered.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    {["Class", "Code", "Level", "Class Teacher", "Students", "Streams", "Academic Year", "Status"].map((h) => (
                      <th key={h} style={{ padding: "12px 14px", textAlign: "left" as const, color: "#94a3b8", fontWeight: 700, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{h}</th>
                    ))}
                    <th style={{ padding: "12px 14px", textAlign: "right" as const, color: "#94a3b8", fontWeight: 700, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((c) => (
                    <tr key={c.id} onClick={() => setSelected({ id: c.id, tab: "overview" })} style={{ borderBottom: "1px solid #f1f5f9", cursor: "pointer", opacity: busyId === c.id ? 0.5 : 1 }}>
                      <td style={{ padding: "13px 14px", fontWeight: 600, color: "#0f172a" }}>{c.name}</td>
                      <td style={{ padding: "13px 14px", color: "#3b82f6", fontWeight: 600 }}>{c.code}</td>
                      <td style={{ padding: "13px 14px", color: "#334155" }}>{c.educationLevel || "—"}</td>
                      <td style={{ padding: "13px 14px", color: "#334155" }}>{loadingTeachers ? "…" : teacherName(c.classTeacherId)}</td>
                      <td style={{ padding: "13px 14px", color: "#334155" }}>{loadingStudents ? "…" : studentCountFor(c.name)}{c.maxStudents ? ` / ${c.maxStudents}` : ""}</td>
                      <td style={{ padding: "13px 14px", color: "#334155" }}>{streamCounts[c.id] ?? "…"}</td>
                      <td style={{ padding: "13px 14px", color: "#334155" }}>{c.academicYear || "—"}</td>
                      <td style={{ padding: "13px 14px" }}><StatusPill status={c.status} /></td>
                      <td style={{ padding: "13px 14px", textAlign: "right" as const }}>
                        <ClassActionsMenu cls={c} onAction={(kind) => handleAction(c, kind)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loadingClasses && !classesError && filtered.length > 0 && totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #f1f5f9", flexWrap: "wrap" as const, gap: 12 }}>
              <span style={{ fontSize: 12.5, color: "#64748b" }}>Showing {(currentPage - 1) * ROWS_PER_PAGE + 1}-{Math.min(currentPage * ROWS_PER_PAGE, filtered.length)} of {filtered.length} classes</span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: currentPage === 1 ? "not-allowed" : "pointer", color: "#64748b", fontSize: 12.5 }}>Prev</button>
                <span style={{ fontSize: 12.5, color: "#334155", padding: "0 6px" }}>{currentPage} / {totalPages}</span>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: "6px 12px", border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: currentPage === totalPages ? "not-allowed" : "pointer", color: "#64748b", fontSize: 12.5 }}>Next</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {assignTeacherFor && (
        <AssignTeacherModal
          cls={assignTeacherFor}
          teachers={teachers}
          onClose={() => setAssignTeacherFor(null)}
          onSaved={(teacherId) => {
            setClasses((prev) => prev.map((c) => c.id === assignTeacherFor.id ? { ...c, classTeacherId: teacherId } : c));
            setAssignTeacherFor(null);
          }}
        />
      )}
    </div>
  );
}

function statusOptionsWithAll(): string[] {
  return ["All Status", ...STATUS_OPTIONS];
}
