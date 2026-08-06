import { useEffect, useMemo, useState } from "react";
import { studentService } from "../api/studentService";
import { attendanceService } from "../api/attendanceService";
import {
  Calendar, ChevronDown, Filter, CheckCircle2, XCircle, Clock, HelpCircle,
  Send, FileText, Users, AlertCircle, Phone, BarChart2,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type MarkStatus = "present" | "absent" | "late" | "excused" | null;

interface RosterStudent {
  id: string;
  admissionNo: string;
  name: string;
  gender: string;
  className: string;
  stream: string;
  parentName: string;
  parentPhone: string;
}

const SESSION_OPTIONS = ["Full Day", "Morning", "Afternoon"];
const SUBJECT_OPTIONS = ["Mathematics", "English Language", "Physics", "Chemistry", "Biology", "History", "Geography"];

const AVATAR_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#f97316", "#06b6d4"];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function currentAcademicYear(): string {
  const d = new Date();
  const y = d.getFullYear();
  const startYear = d.getMonth() >= 7 ? y : y - 1; // school year starts in August
  return `${startYear}/${String((startYear + 1) % 100).padStart(2, "0")}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function avatarColor(name: string): string {
  const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function normalizeStudent(raw: any): RosterStudent {
  const name =
    [raw.firstName, raw.surname ?? raw.lastName, raw.otherNames].filter(Boolean).join(" ").trim() ||
    raw.name || "Unnamed Student";
  return {
    id: String(raw._id ?? raw.id ?? raw.studentId ?? name),
    admissionNo: String(raw.admissionNo ?? raw.admissionNumber ?? raw.studentId ?? "—"),
    name,
    gender: raw.gender ?? "—",
    className: raw.class ?? raw.className ?? raw.level ?? "—",
    stream: raw.stream ?? raw.section ?? "—",
    parentName: raw.parentName ?? raw.guardianName ?? raw.parent?.name ?? "—",
    parentPhone: raw.parentPhone ?? raw.guardianPhone ?? raw.parent?.phone ?? "",
  };
}

// ── Small pieces ─────────────────────────────────────────────────────────────

function FilterField({
  label, children,
}: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 150 }}>
      <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Select({
  value, onChange, options, placeholder,
}: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "9px 32px 9px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0",
          fontSize: 13, color: value ? "#0f172a" : "#94a3b8", background: "#fff", outline: "none",
          appearance: "none" as const, cursor: "pointer", boxSizing: "border-box" as const,
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
    </div>
  );
}

function StatusButton({
  active, color, onClick, icon,
}: { active: boolean; color: string; onClick: () => void; icon: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
        border: active ? `2px solid ${color}` : "1.5px solid #e2e8f0",
        background: active ? color + "18" : "#fff", color: active ? color : "#cbd5e1",
        cursor: "pointer",
      }}
    >
      {icon}
    </button>
  );
}

function StatBox({ label, value, color, bg }: { label: string; value: number; color: string; bg?: string }) {
  return (
    <div style={{ background: bg ?? "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
      <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color }}>{value}</p>
      <p style={{ margin: "2px 0 0", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.04em", textTransform: "uppercase" as const }}>{label}</p>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function StudentAttendance({ embedded = false }: { embedded?: boolean }) {
  const [allStudents, setAllStudents] = useState<RosterStudent[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [date, setDate] = useState(todayIso());
  const [classFilter, setClassFilter] = useState("");
  const [streamFilter, setStreamFilter] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [session, setSession] = useState("Full Day");

  const [roster, setRoster] = useState<RosterStudent[] | null>(null);
  const [marks, setMarks] = useState<Record<string, MarkStatus>>({});
  const [submitting, setSubmitting] = useState(false);

  const loadStudents = () => {
    setLoadingStudents(true);
    setLoadError(null);
    studentService.getAll()
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.students ?? res.data?.data ?? [];
        setAllStudents(raw.map(normalizeStudent));
      })
      .catch((err) => setLoadError(err.response?.data?.message ?? "Failed to load students."))
      .finally(() => setLoadingStudents(false));
  };

  useEffect(() => { loadStudents(); }, []);

  const classOptions = useMemo(
    () => Array.from(new Set(allStudents.map((s) => s.className).filter((c) => c && c !== "—"))),
    [allStudents]
  );
  const streamOptions = useMemo(
    () => Array.from(new Set(allStudents.map((s) => s.stream).filter((s) => s && s !== "—"))),
    [allStudents]
  );

  const fetchList = () => {
    const filtered = allStudents.filter((s) =>
      (!classFilter || s.className === classFilter) &&
      (!streamFilter || s.stream === streamFilter)
    );
    setRoster(filtered);
    const initialMarks: Record<string, MarkStatus> = {};
    filtered.forEach((s) => { initialMarks[s.id] = null; });
    setMarks(initialMarks);
  };

  const setMark = (id: string, status: MarkStatus) => {
    setMarks((prev) => ({ ...prev, [id]: prev[id] === status ? null : status }));
  };

  const markAll = (status: MarkStatus) => {
    if (!roster) return;
    const next: Record<string, MarkStatus> = {};
    roster.forEach((s) => { next[s.id] = status; });
    setMarks(next);
  };

  const counts = useMemo(() => {
    const c = { present: 0, absent: 0, late: 0, excused: 0 };
    Object.values(marks).forEach((m) => { if (m) c[m]++; });
    return c;
  }, [marks]);

  const markedCount = counts.present + counts.absent + counts.late + counts.excused;
  const totalCount = roster?.length ?? 0;
  const remaining = totalCount - markedCount;
  const progressPct = totalCount > 0 ? (markedCount / totalCount) * 100 : 0;

  const classLabel = [classFilter, streamFilter].filter(Boolean).join(" ") || "the selected class";

  const buildPayload = () => ({
    date, classId: classFilter, stream: streamFilter, subject: subjectFilter, session,
    records: (roster ?? []).map((s) => ({ studentId: s.id, status: marks[s.id] ?? "unmarked" })),
  });

  const handleSubmit = async () => {
    if (!roster || roster.length === 0) return;
    setSubmitting(true);
    try {
      await attendanceService.submit(buildPayload());
      alert("Attendance submitted successfully!");
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to submit attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!roster || roster.length === 0) return;
    setSubmitting(true);
    try {
      await attendanceService.saveDraft(buildPayload());
      alert("Draft saved.");
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to save draft.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: embedded ? undefined : "100vh", background: embedded ? "transparent" : "#f1f5f9", padding: embedded ? "20px" : "28px 28px", fontFamily: "'Inter', 'Segoe UI', sans-serif", textAlign: "left" as const }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 12.5, color: "#94a3b8" }}>Students <span style={{ margin: "0 4px" }}>›</span> Student Attendance</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "4px 0 0" }}>Student Attendance</h1>
        </div>

        {/* ── Filter bar ────────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" as const }}>
            <FilterField label="Attendance Date">
              <div style={{ position: "relative" }}>
                <Calendar size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                <input
                  type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#0f172a", background: "#fff", outline: "none", boxSizing: "border-box" as const }}
                />
              </div>
            </FilterField>
            <FilterField label="Grade/Class">
              <Select value={classFilter} onChange={setClassFilter} options={classOptions} placeholder="Select class" />
            </FilterField>
            <FilterField label="Stream">
              <Select value={streamFilter} onChange={setStreamFilter} options={streamOptions} placeholder="All Streams" />
            </FilterField>
            <FilterField label="Subject (Optional)">
              <Select value={subjectFilter} onChange={setSubjectFilter} options={SUBJECT_OPTIONS} placeholder="General" />
            </FilterField>
            <FilterField label="Session">
              <Select value={session} onChange={setSession} options={SESSION_OPTIONS} placeholder="Select session" />
            </FilterField>
            <button
              onClick={fetchList}
              disabled={!classFilter || loadingStudents}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: "none",
                background: !classFilter || loadingStudents ? "#93c5fd" : "linear-gradient(135deg,#3b82f6,#6366f1)",
                color: "#fff", fontSize: 13, fontWeight: 600, cursor: !classFilter || loadingStudents ? "not-allowed" : "pointer",
                height: 38,
              }}
            >
              <Filter size={14} /> Fetch List
            </button>
          </div>
          {loadError && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontSize: 12.5 }}>
              <AlertCircle size={14} /> {loadError}
              <button onClick={loadStudents} style={{ marginLeft: 6, background: "none", border: "none", color: "#3b82f6", fontWeight: 600, cursor: "pointer", fontSize: 12.5 }}>Retry</button>
            </div>
          )}
        </div>

        {roster === null && !loadError && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "60px 0", textAlign: "center", color: "#94a3b8" }}>
            <Users size={28} style={{ marginBottom: 10 }} />
            <p style={{ margin: 0, fontSize: 13.5 }}>Select a class and click "Fetch List" to load the attendance roster.</p>
          </div>
        )}

        {roster !== null && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, alignItems: "flex-start" }}>

            {/* ── Class list card ─────────────────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Class List</p>
                  <span style={{ background: "#eff6ff", color: "#3b82f6", fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                    {classLabel} · {currentAcademicYear()}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => markAll("present")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#10b981", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    <CheckCircle2 size={13} /> Mark All Present
                  </button>
                  <button onClick={() => markAll("absent")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    <XCircle size={13} /> Mark All Absent
                  </button>
                </div>
              </div>

              {roster.length === 0 ? (
                <div style={{ padding: "50px 0", textAlign: "center", color: "#94a3b8", fontSize: 13.5 }}>
                  No students found for this class/stream.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        {["Admission #", "Student Name", "Gender", "Parent/Guardian", "Attendance Status"].map((h) => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#94a3b8", fontWeight: 700, fontSize: 10.5, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {roster.map((s) => (
                        <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                          <td style={{ padding: "12px 14px", color: "#334155" }}>{s.admissionNo}</td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                              <div style={{
                                width: 32, height: 32, borderRadius: "50%", background: avatarColor(s.name),
                                display: "flex", alignItems: "center", justifyContent: "center",
                                color: "#fff", fontSize: 11.5, fontWeight: 700, flexShrink: 0,
                              }}>
                                {initials(s.name)}
                              </div>
                              <span style={{ fontWeight: 600, color: "#0f172a" }}>{s.name}</span>
                            </div>
                          </td>
                          <td style={{ padding: "12px 14px", color: "#334155", textTransform: "uppercase" as const, fontSize: 11.5 }}>{s.gender}</td>
                          <td style={{ padding: "12px 14px", color: "#334155" }}>
                            <div>{s.parentName}</div>
                            {s.parentPhone && (
                              <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                                <Phone size={11} /> {s.parentPhone}
                              </div>
                            )}
                          </td>
                          <td style={{ padding: "12px 14px" }}>
                            <div style={{ display: "flex", gap: 6 }}>
                              <StatusButton active={marks[s.id] === "present"} color="#10b981" onClick={() => setMark(s.id, "present")} icon={<CheckCircle2 size={15} />} />
                              <StatusButton active={marks[s.id] === "absent"} color="#ef4444" onClick={() => setMark(s.id, "absent")} icon={<XCircle size={15} />} />
                              <StatusButton active={marks[s.id] === "late"} color="#f59e0b" onClick={() => setMark(s.id, "late")} icon={<Clock size={15} />} />
                              <StatusButton active={marks[s.id] === "excused"} color="#6366f1" onClick={() => setMark(s.id, "excused")} icon={<HelpCircle size={15} />} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {roster.length > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #f1f5f9", flexWrap: "wrap" as const, gap: 10 }}>
                  <span style={{ fontSize: 12.5, color: "#64748b" }}>
                    Showing {roster.length} of {roster.length} total students in {classLabel}
                  </span>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button onClick={handleSaveDraft} disabled={submitting} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#334155", cursor: submitting ? "not-allowed" : "pointer" }}>
                      <FileText size={14} /> Save Draft
                    </button>
                    <button onClick={handleSubmit} disabled={submitting} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer" }}>
                      <Send size={14} /> Submit Attendance
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Real-time summary ──────────────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden", position: "sticky" as const, top: 20 }}>
              <div style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", padding: "16px 18px", color: "#fff" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <BarChart2 size={16} />
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 14.5 }}>Real-time Summary</p>
                </div>
                <p style={{ margin: "4px 0 0", fontSize: 11.5, opacity: 0.85 }}>Automatic tracking of current status</p>
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
                  <StatBox label="Present" value={counts.present} color="#10b981" />
                  <StatBox label="Absent" value={counts.absent} color="#ef4444" bg="#fef2f2" />
                  <StatBox label="Late" value={counts.late} color="#f59e0b" />
                  <StatBox label="Excused" value={counts.excused} color="#6366f1" />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Progress Marked</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{markedCount}/{totalCount}</span>
                </div>
                <div style={{ height: 6, background: "#f1f5f9", borderRadius: 4 }}>
                  <div style={{ width: `${progressPct}%`, height: "100%", background: "#3b82f6", borderRadius: 4 }} />
                </div>
                <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "#94a3b8", fontStyle: "italic" }}>
                  {remaining > 0 ? `${remaining} students remaining` : "All students marked"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
