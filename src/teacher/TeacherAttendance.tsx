import { useEffect, useMemo, useRef, useState } from "react";
import { teacherService } from "../api/teacherService";
import { teacherAttendanceService } from "../api/teacherAttendanceService";
import {
  Calendar, ChevronDown, Filter, CheckCircle2, XCircle, Send, FileText,
  Users, AlertCircle, BarChart2, StickyNote, User,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

type MarkStatus = "Present" | "Absent" | "Late" | "Excused" | "";

interface RosterTeacher {
  id: string;
  employeeNo: string;
  name: string;
  department: string;
}

interface AttendanceEntry {
  status: MarkStatus;
  timeIn: string;
  timeOut: string;
  reason: string;
  remarks: string;
}

const SESSION_OPTIONS = ["Full Day", "Morning", "Afternoon"];
const STATUS_OPTIONS: MarkStatus[] = ["Present", "Absent", "Late", "Excused"];
const AVATAR_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#f97316", "#06b6d4"];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function avatarColor(name: string): string {
  const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function blankEntry(): AttendanceEntry {
  return { status: "", timeIn: "", timeOut: "", reason: "", remarks: "" };
}

function normalizeTeacher(raw: any): RosterTeacher {
  const name =
    [raw.firstName, raw.middleName, raw.lastName].filter(Boolean).join(" ").trim() ||
    raw.name || "Unnamed Teacher";
  return {
    id: String(raw._id ?? raw.id ?? raw.teacherId ?? name),
    employeeNo: String(raw.teacherId ?? raw.employeeNo ?? raw._id ?? raw.id ?? "—"),
    name,
    department: raw.department ?? "—",
  };
}

// ── Small pieces ─────────────────────────────────────────────────────────────

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

const STATUS_COLORS: Record<string, string> = {
  Present: "#10b981", Absent: "#ef4444", Late: "#f59e0b", Excused: "#6366f1",
};

function StatusSelect({ value, onChange }: { value: MarkStatus; onChange: (v: MarkStatus) => void }) {
  const color = value ? STATUS_COLORS[value] : "#94a3b8";
  return (
    <div style={{ position: "relative", minWidth: 130 }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as MarkStatus)}
        style={{
          width: "100%", padding: "7px 30px 7px 12px", borderRadius: 8,
          border: `1.5px solid ${value ? color : "#e2e8f0"}`, background: value ? color + "14" : "#fff",
          fontSize: 12.5, fontWeight: 700, color, outline: "none", appearance: "none" as const, cursor: "pointer",
        }}
      >
        <option value="">Unmarked</option>
        {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <ChevronDown size={13} style={{ position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)", color, pointerEvents: "none" }} />
    </div>
  );
}

function TimeInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled: boolean }) {
  return (
    <input
      type="time" value={value} disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: 110, padding: "6px 8px", borderRadius: 7, border: "1.5px solid #e2e8f0",
        fontSize: 12.5, color: disabled ? "#cbd5e1" : "#0f172a", background: disabled ? "#f8fafc" : "#fff",
        outline: "none", boxSizing: "border-box" as const,
      }}
    />
  );
}

function NotesPopover({
  reason, remarks, showReason, onChange,
}: { reason: string; remarks: string; showReason: boolean; onChange: (field: "reason" | "remarks", v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const hasContent = Boolean(reason || remarks);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); setOpen(false); } };
    document.addEventListener("mousedown", onClickOutside);
    window.addEventListener("keydown", onKeyDown, true);
    return () => { document.removeEventListener("mousedown", onClickOutside); window.removeEventListener("keydown", onKeyDown, true); };
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        title="Reason / Remarks"
        style={{
          background: hasContent ? "#eff6ff" : "none", border: hasContent ? "1px solid #bfdbfe" : "1px solid transparent",
          borderRadius: 7, cursor: "pointer", color: hasContent ? "#3b82f6" : "#94a3b8", display: "flex", padding: 6,
        }}
      >
        <StickyNote size={14} />
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 4px)", background: "#fff",
          border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          width: 260, zIndex: 60, padding: 14,
        }}>
          {showReason && (
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: "#334155", marginBottom: 4, display: "block" }}>Reason for Absence</label>
              <input
                value={reason} onChange={(e) => onChange("reason", e.target.value)}
                placeholder="e.g. Sick leave"
                style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1.5px solid #e2e8f0", fontSize: 12.5, outline: "none", boxSizing: "border-box" as const }}
              />
            </div>
          )}
          <div>
            <label style={{ fontSize: 11.5, fontWeight: 600, color: "#334155", marginBottom: 4, display: "block" }}>Remarks</label>
            <textarea
              value={remarks} onChange={(e) => onChange("remarks", e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              style={{ width: "100%", padding: "7px 10px", borderRadius: 7, border: "1.5px solid #e2e8f0", fontSize: 12.5, outline: "none", resize: "vertical" as const, boxSizing: "border-box" as const, fontFamily: "inherit" }}
            />
          </div>
        </div>
      )}
    </div>
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

export default function TeacherAttendance({ embedded = false }: { embedded?: boolean }) {
  const [allTeachers, setAllTeachers] = useState<RosterTeacher[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [date, setDate] = useState(todayIso());
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [session, setSession] = useState("Full Day");

  const [roster, setRoster] = useState<RosterTeacher[] | null>(null);
  const [entries, setEntries] = useState<Record<string, AttendanceEntry>>({});
  const [recordedBy, setRecordedBy] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadTeachers = () => {
    setLoadingTeachers(true);
    setLoadError(null);
    teacherService.getAll()
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.teachers ?? res.data?.data ?? [];
        setAllTeachers(raw.map(normalizeTeacher));
      })
      .catch((err) => setLoadError(err.response?.data?.message ?? "Failed to load teachers."))
      .finally(() => setLoadingTeachers(false));
  };

  useEffect(() => { loadTeachers(); }, []);

  const departmentOptions = useMemo(
    () => Array.from(new Set(allTeachers.map((t) => t.department).filter((d) => d && d !== "—"))),
    [allTeachers]
  );

  const fetchList = () => {
    const filtered = allTeachers.filter((t) => !departmentFilter || t.department === departmentFilter);
    setRoster(filtered);
    const initial: Record<string, AttendanceEntry> = {};
    filtered.forEach((t) => { initial[t.id] = blankEntry(); });
    setEntries(initial);
  };

  const updateEntry = (id: string, patch: Partial<AttendanceEntry>) => {
    setEntries((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const setStatus = (id: string, status: MarkStatus) => {
    setEntries((prev) => {
      const current = prev[id] ?? blankEntry();
      const clearsTimes = status === "Absent" || status === "Excused" || status === "";
      return { ...prev, [id]: { ...current, status, timeIn: clearsTimes ? "" : current.timeIn, timeOut: clearsTimes ? "" : current.timeOut } };
    });
  };

  const markAll = (status: MarkStatus) => {
    if (!roster) return;
    const clearsTimes = status === "Absent" || status === "Excused";
    const next: Record<string, AttendanceEntry> = {};
    roster.forEach((t) => {
      const current = entries[t.id] ?? blankEntry();
      next[t.id] = { ...current, status, timeIn: clearsTimes ? "" : current.timeIn, timeOut: clearsTimes ? "" : current.timeOut };
    });
    setEntries(next);
  };

  const counts = useMemo(() => {
    const c = { Present: 0, Absent: 0, Late: 0, Excused: 0 };
    Object.values(entries).forEach((e) => { if (e.status) c[e.status]++; });
    return c;
  }, [entries]);

  const markedCount = counts.Present + counts.Absent + counts.Late + counts.Excused;
  const totalCount = roster?.length ?? 0;
  const remaining = totalCount - markedCount;
  const progressPct = totalCount > 0 ? (markedCount / totalCount) * 100 : 0;

  const departmentLabel = departmentFilter || "All Departments";

  const buildPayload = () => ({
    date, department: departmentFilter, session, recordedBy,
    records: (roster ?? []).map((t) => ({
      teacherId: t.id, status: entries[t.id]?.status || "unmarked",
      timeIn: entries[t.id]?.timeIn ?? "", timeOut: entries[t.id]?.timeOut ?? "",
      reason: entries[t.id]?.reason ?? "", remarks: entries[t.id]?.remarks ?? "",
    })),
  });

  const handleSubmit = async () => {
    if (!roster || roster.length === 0) return;
    setSubmitting(true);
    try {
      await teacherAttendanceService.submit(buildPayload());
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
      await teacherAttendanceService.saveDraft(buildPayload());
      alert("Draft saved.");
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to save draft.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: embedded ? undefined : "100vh", background: embedded ? "transparent" : "#f1f5f9", padding: embedded ? "20px" : "28px 28px", fontFamily: "'Inter', 'Segoe UI', sans-serif", textAlign: "left" as const }}>
      <div style={{ maxWidth: 1320, margin: "0 auto" }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 12.5, color: "#94a3b8" }}>Teachers <span style={{ margin: "0 4px" }}>›</span> Teacher Attendance</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "4px 0 0" }}>Teacher Attendance</h1>
        </div>

        {/* ── Filter bar ────────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "18px 20px", marginBottom: 20 }}>
          <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" as const }}>
            <FilterField label="Date">
              <div style={{ position: "relative" }}>
                <Calendar size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
                <input
                  type="date" value={date} onChange={(e) => setDate(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#0f172a", background: "#fff", outline: "none", boxSizing: "border-box" as const }}
                />
              </div>
            </FilterField>
            <FilterField label="Department">
              <Select value={departmentFilter} onChange={setDepartmentFilter} options={departmentOptions} placeholder="All Departments" />
            </FilterField>
            <FilterField label="Attendance Session">
              <Select value={session} onChange={setSession} options={SESSION_OPTIONS} placeholder="Select session" />
            </FilterField>
            <button
              onClick={fetchList}
              disabled={loadingTeachers}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: "none",
                background: loadingTeachers ? "#93c5fd" : "linear-gradient(135deg,#3b82f6,#6366f1)",
                color: "#fff", fontSize: 13, fontWeight: 600, cursor: loadingTeachers ? "not-allowed" : "pointer",
                height: 38,
              }}
            >
              <Filter size={14} /> Fetch List
            </button>
          </div>
          {loadError && (
            <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontSize: 12.5 }}>
              <AlertCircle size={14} /> {loadError}
              <button onClick={loadTeachers} style={{ marginLeft: 6, background: "none", border: "none", color: "#3b82f6", fontWeight: 600, cursor: "pointer", fontSize: 12.5 }}>Retry</button>
            </div>
          )}
        </div>

        {roster === null && !loadError && (
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "60px 0", textAlign: "center", color: "#94a3b8" }}>
            <Users size={28} style={{ marginBottom: 10 }} />
            <p style={{ margin: 0, fontSize: 13.5 }}>Choose a department (or leave blank for everyone) and click "Fetch List" to load the attendance roster.</p>
          </div>
        )}

        {roster !== null && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 16, alignItems: "flex-start" }}>

            {/* ── Teacher list card ───────────────────────────────────── */}
            <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Teacher Attendance List</p>
                  <span style={{ background: "#eff6ff", color: "#3b82f6", fontSize: 11.5, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>
                    {departmentLabel} · {date}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => markAll("Present")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid #bbf7d0", background: "#f0fdf4", color: "#10b981", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    <CheckCircle2 size={13} /> Mark All Present
                  </button>
                  <button onClick={() => markAll("Absent")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 7, border: "1px solid #fecaca", background: "#fef2f2", color: "#ef4444", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    <XCircle size={13} /> Mark All Absent
                  </button>
                </div>
              </div>

              {roster.length === 0 ? (
                <div style={{ padding: "50px 0", textAlign: "center", color: "#94a3b8", fontSize: 13.5 }}>
                  No teachers found for this department.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                        {["Employee No.", "Teacher", "Department", "Status", "Time In", "Time Out", ""].map((h) => (
                          <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#94a3b8", fontWeight: 700, fontSize: 10.5, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {roster.map((t) => {
                        const entry = entries[t.id] ?? blankEntry();
                        const timesDisabled = entry.status === "Absent" || entry.status === "Excused" || entry.status === "";
                        return (
                          <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "12px 14px", color: "#334155" }}>{t.employeeNo}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                                <div style={{
                                  width: 32, height: 32, borderRadius: "50%", background: avatarColor(t.name),
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  color: "#fff", fontSize: 11.5, fontWeight: 700, flexShrink: 0,
                                }}>
                                  {initials(t.name)}
                                </div>
                                <span style={{ fontWeight: 600, color: "#0f172a" }}>{t.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: "12px 14px", color: "#334155" }}>{t.department}</td>
                            <td style={{ padding: "12px 14px" }}>
                              <StatusSelect value={entry.status} onChange={(v) => setStatus(t.id, v)} />
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <TimeInput value={entry.timeIn} disabled={timesDisabled} onChange={(v) => updateEntry(t.id, { timeIn: v })} />
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <TimeInput value={entry.timeOut} disabled={timesDisabled} onChange={(v) => updateEntry(t.id, { timeOut: v })} />
                            </td>
                            <td style={{ padding: "12px 14px" }}>
                              <NotesPopover
                                reason={entry.reason} remarks={entry.remarks}
                                showReason={entry.status === "Absent" || entry.status === "Excused"}
                                onChange={(field, v) => updateEntry(t.id, { [field]: v })}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {roster.length > 0 && (
                <div style={{ padding: "16px 20px", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 12, marginBottom: 14 }}>
                    <span style={{ fontSize: 12.5, color: "#64748b" }}>
                      Showing {roster.length} of {roster.length} teachers in {departmentLabel}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap" as const, gap: 12 }}>
                    <div style={{ minWidth: 220 }}>
                      <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 6 }}>Recorded By</label>
                      <div style={{ position: "relative" }}>
                        <User size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                        <input
                          value={recordedBy} onChange={(e) => setRecordedBy(e.target.value)}
                          placeholder="Enter your name"
                          style={{ width: "100%", padding: "9px 12px 9px 34px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#0f172a", outline: "none", boxSizing: "border-box" as const }}
                        />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button onClick={handleSaveDraft} disabled={submitting} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#334155", cursor: submitting ? "not-allowed" : "pointer" }}>
                        <FileText size={14} /> Save Draft
                      </button>
                      <button onClick={handleSubmit} disabled={submitting} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: submitting ? "not-allowed" : "pointer" }}>
                        <Send size={14} /> Submit Attendance
                      </button>
                    </div>
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
                  <StatBox label="Present" value={counts.Present} color="#10b981" />
                  <StatBox label="Absent" value={counts.Absent} color="#ef4444" bg="#fef2f2" />
                  <StatBox label="Late" value={counts.Late} color="#f59e0b" />
                  <StatBox label="Excused" value={counts.Excused} color="#6366f1" />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Progress Marked</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>{markedCount}/{totalCount}</span>
                </div>
                <div style={{ height: 6, background: "#f1f5f9", borderRadius: 4 }}>
                  <div style={{ width: `${progressPct}%`, height: "100%", background: "#3b82f6", borderRadius: 4 }} />
                </div>
                <p style={{ margin: "8px 0 0", fontSize: 11.5, color: "#94a3b8", fontStyle: "italic" }}>
                  {remaining > 0 ? `${remaining} teachers remaining` : "All teachers marked"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
