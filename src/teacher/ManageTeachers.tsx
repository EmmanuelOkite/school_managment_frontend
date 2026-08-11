import { useEffect, useMemo, useRef, useState } from "react";
import { teacherService } from "../api/teacherService";
import {
  Search, ChevronDown, MoreVertical, Eye, Pencil, Trash2, ClipboardList,
  BookOpen, School, KeyRound, AlertCircle, Users, X, Phone, Mail,
  ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface Account {
  username: string;
  email: string;
  role: string;
}

interface TeacherRow {
  id: string;
  employeeNo: string;
  name: string;
  gender: string;
  department: string;
  position: string;
  subjects: string[];
  classes: string[];
  streams: string;
  phone: string;
  email: string;
  address: string;
  nationality: string;
  employmentType: string;
  employmentStatus: string;
  dateOfJoining: string;
  highestQualification: string;
  institution: string;
  specialization: string;
  yearsOfExperience: string;
  classTeacher: boolean;
  account: Account | null;
}

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50];
const FLAGGED_STATUSES = ["suspended", "inactive"];

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeTeacher(raw: any): TeacherRow {
  const name =
    [raw.firstName, raw.middleName, raw.lastName].filter(Boolean).join(" ").trim() ||
    raw.name || "Unnamed Teacher";

  const account = raw.account && (raw.account.username || raw.account.email)
    ? { username: raw.account.username ?? "—", email: raw.account.email ?? "—", role: raw.account.role ?? "—" }
    : null;

  return {
    id: String(raw._id ?? raw.id ?? raw.teacherId ?? name),
    employeeNo: String(raw.teacherId ?? raw.employeeNo ?? raw._id ?? raw.id ?? "—"),
    name,
    gender: raw.gender ?? "—",
    department: raw.department ?? "—",
    position: raw.position ?? "—",
    subjects: Array.isArray(raw.subjectsTaught) ? raw.subjectsTaught : (raw.subjectsTaught ? [raw.subjectsTaught] : []),
    classes: Array.isArray(raw.assignedClasses) ? raw.assignedClasses : (raw.assignedClasses ? [raw.assignedClasses] : []),
    streams: raw.assignedStreams ?? "",
    phone: raw.phoneNumber ?? raw.phone ?? "—",
    email: raw.email ?? "—",
    address: raw.address ?? "—",
    nationality: raw.nationality ?? "—",
    employmentType: raw.employmentType ?? "—",
    employmentStatus: raw.employmentStatus ?? "Active",
    dateOfJoining: raw.dateOfJoining ?? "",
    highestQualification: raw.highestQualification ?? "—",
    institution: raw.institution ?? "—",
    specialization: raw.specialization ?? "—",
    yearsOfExperience: raw.yearsOfExperience != null ? String(raw.yearsOfExperience) : "—",
    classTeacher: Boolean(raw.classTeacher),
    account,
  };
}

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function joinOrDash(list: string[]): string {
  return list.length > 0 ? list.join(", ") : "—";
}

// ── Small pieces ─────────────────────────────────────────────────────────────

function FilterSelect({
  value, onChange, options,
}: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          padding: "9px 32px 9px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0",
          fontSize: 13, color: "#334155", background: "#fff", outline: "none",
          appearance: "none" as const, cursor: "pointer", minWidth: 150,
        }}
      >
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (FLAGGED_STATUSES.includes(status.toLowerCase())) {
    return (
      <span style={{
        fontSize: 11, fontWeight: 700, color: "#ef4444", background: "#fef2f2",
        padding: "3px 10px", borderRadius: 20, letterSpacing: "0.03em", textTransform: "uppercase" as const,
      }}>
        {status}
      </span>
    );
  }
  if (status.toLowerCase() === "on leave") {
    return (
      <span style={{
        fontSize: 11, fontWeight: 700, color: "#f59e0b", background: "#fffbeb",
        padding: "3px 10px", borderRadius: 20, letterSpacing: "0.03em", textTransform: "uppercase" as const,
      }}>
        {status}
      </span>
    );
  }
  return <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{status}</span>;
}

// ── Modal shell ──────────────────────────────────────────────────────────────

function ModalShell({
  title, onClose, children, width = 460,
}: { title: string; onClose: () => void; children: React.ReactNode; width?: number }) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); onClose(); } };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(15,23,42,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ width: "100%", maxWidth: width, maxHeight: "85vh", overflowY: "auto", background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", padding: 24 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{title}</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
            <X size={18} />
          </button>
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

function FieldInput({
  label, value, onChange, icon,
}: { label: string; value: string; onChange: (v: string) => void; icon?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6, display: "block" }}>{label}</label>
      <div style={{ position: "relative" }}>
        {icon && <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }}>{icon}</div>}
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ width: "100%", padding: icon ? "10px 14px 10px 34px" : "10px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13.5, color: "#0f172a", outline: "none", boxSizing: "border-box" as const }}
        />
      </div>
    </div>
  );
}

// ── Row actions menu ─────────────────────────────────────────────────────────

type ActionKind = "profile" | "edit" | "delete" | "attendance" | "subjects" | "classes" | "account";

function ActionsMenu({ onAction }: { onAction: (kind: ActionKind) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const items: { kind: ActionKind; label: string; icon: React.ReactNode; danger?: boolean }[] = [
    { kind: "profile", label: "View Profile", icon: <Eye size={14} /> },
    { kind: "edit", label: "Edit", icon: <Pencil size={14} /> },
    { kind: "attendance", label: "View Attendance", icon: <ClipboardList size={14} /> },
    { kind: "subjects", label: "View Assigned Subjects", icon: <BookOpen size={14} /> },
    { kind: "classes", label: "View Assigned Classes", icon: <School size={14} /> },
    { kind: "account", label: "Manage Account", icon: <KeyRound size={14} /> },
    { kind: "delete", label: "Delete / Deactivate", icon: <Trash2 size={14} />, danger: true },
  ];

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen((p) => !p)}
        title="Actions"
        style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex", padding: 4 }}
      >
        <MoreVertical size={16} />
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 4px)", background: "#fff",
          border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          minWidth: 200, zIndex: 60, overflow: "hidden",
        }}>
          {items.map((item) => (
            <button
              key={item.kind}
              onClick={() => { setOpen(false); onAction(item.kind); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "9px 14px", background: "none", border: "none", cursor: "pointer",
                fontSize: 13, color: item.danger ? "#ef4444" : "#334155", textAlign: "left" as const,
              }}
            >
              {item.icon} {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ManageTeachers({ embedded = false }: { embedded?: boolean }) {
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [genderFilter, setGenderFilter] = useState("All Genders");
  const [departmentFilter, setDepartmentFilter] = useState("All Departments");
  const [subjectFilter, setSubjectFilter] = useState("All Subjects");
  const [classFilter, setClassFilter] = useState("All Classes");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("All Employment Types");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [modal, setModal] = useState<{ kind: ActionKind; teacher: TeacherRow } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadTeachers = () => {
    setLoading(true);
    setError(null);
    teacherService.getAll()
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.teachers ?? res.data?.data ?? [];
        setTeachers(raw.map(normalizeTeacher));
      })
      .catch((err) => setError(err.response?.data?.message ?? "Failed to load teachers."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTeachers(); }, []);

  const genderOptions = useMemo(() => ["All Genders", ...Array.from(new Set(teachers.map((t) => t.gender).filter((v) => v && v !== "—")))], [teachers]);
  const departmentOptions = useMemo(() => ["All Departments", ...Array.from(new Set(teachers.map((t) => t.department).filter((v) => v && v !== "—")))], [teachers]);
  const subjectOptions = useMemo(() => ["All Subjects", ...Array.from(new Set(teachers.flatMap((t) => t.subjects)))], [teachers]);
  const classOptions = useMemo(() => ["All Classes", ...Array.from(new Set(teachers.flatMap((t) => t.classes)))], [teachers]);
  const employmentTypeOptions = useMemo(() => ["All Employment Types", ...Array.from(new Set(teachers.map((t) => t.employmentType).filter((v) => v && v !== "—")))], [teachers]);
  const statusOptions = useMemo(() => ["All Status", ...Array.from(new Set(teachers.map((t) => t.employmentStatus).filter(Boolean)))], [teachers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teachers.filter((t) => {
      if (genderFilter !== "All Genders" && t.gender !== genderFilter) return false;
      if (departmentFilter !== "All Departments" && t.department !== departmentFilter) return false;
      if (subjectFilter !== "All Subjects" && !t.subjects.includes(subjectFilter)) return false;
      if (classFilter !== "All Classes" && !t.classes.includes(classFilter)) return false;
      if (employmentTypeFilter !== "All Employment Types" && t.employmentType !== employmentTypeFilter) return false;
      if (statusFilter !== "All Status" && t.employmentStatus !== statusFilter) return false;
      if (q && !(t.name.toLowerCase().includes(q) || t.employeeNo.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [teachers, search, genderFilter, departmentFilter, subjectFilter, classFilter, employmentTypeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const pageRows = filtered.slice(startIdx, startIdx + rowsPerPage);

  const clearFilters = () => {
    setSearch(""); setGenderFilter("All Genders"); setDepartmentFilter("All Departments");
    setSubjectFilter("All Subjects"); setClassFilter("All Classes");
    setEmploymentTypeFilter("All Employment Types"); setStatusFilter("All Status"); setPage(1);
  };

  const handleAction = (kind: ActionKind, teacher: TeacherRow) => {
    if (kind === "delete") {
      if (!window.confirm(`Delete/deactivate ${teacher.name}? This cannot be undone.`)) return;
      setBusyId(teacher.id);
      teacherService.delete(teacher.id)
        .then(() => setTeachers((prev) => prev.filter((t) => t.id !== teacher.id)))
        .catch((err: any) => alert(err.response?.data?.message ?? "Failed to delete teacher."))
        .finally(() => setBusyId(null));
      return;
    }
    setModal({ kind, teacher });
  };

  const updateTeacher = async (id: string, patch: any) => {
    await teacherService.update(id, patch);
    setTeachers((prev) => prev.map((t) => t.id === id ? normalizeTeacher({ ...toRaw(t), ...patch }) : t));
  };

  return (
    <div style={{ minHeight: embedded ? undefined : "100vh", background: embedded ? "transparent" : "#f1f5f9", padding: embedded ? "20px" : "28px 28px", fontFamily: "'Inter', 'Segoe UI', sans-serif", textAlign: "left" as const }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 12.5, color: "#94a3b8" }}>Teachers <span style={{ margin: "0 4px" }}>›</span> Manage Teachers</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "4px 0 0" }}>Manage Teachers</h1>
        </div>

        {/* ── Filter bar ────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18, flexWrap: "wrap" as const }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by name or employee number..."
              style={{
                width: "100%", padding: "9px 14px 9px 34px", borderRadius: 8,
                border: "1.5px solid #e2e8f0", fontSize: 13, color: "#334155",
                background: "#fff", outline: "none", boxSizing: "border-box" as const,
              }}
            />
          </div>
          <FilterSelect value={genderFilter} onChange={(v) => { setGenderFilter(v); setPage(1); }} options={genderOptions} />
          <FilterSelect value={departmentFilter} onChange={(v) => { setDepartmentFilter(v); setPage(1); }} options={departmentOptions} />
          <FilterSelect value={subjectFilter} onChange={(v) => { setSubjectFilter(v); setPage(1); }} options={subjectOptions} />
          <FilterSelect value={classFilter} onChange={(v) => { setClassFilter(v); setPage(1); }} options={classOptions} />
          <FilterSelect value={employmentTypeFilter} onChange={(v) => { setEmploymentTypeFilter(v); setPage(1); }} options={employmentTypeOptions} />
          <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={statusOptions} />
          <button onClick={clearFilters} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Clear Filters
          </button>
        </div>

        {/* ── Table card ────────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>

          {loading && (
            <div style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8", fontSize: 13.5 }}>Loading teachers…</div>
          )}

          {!loading && error && (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <AlertCircle size={22} color="#ef4444" style={{ marginBottom: 8 }} />
              <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "#ef4444" }}>{error}</p>
              <button onClick={loadTeachers} style={{ padding: "8px 18px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8" }}>
              <Users size={28} style={{ marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 13.5 }}>
                {teachers.length === 0 ? "No teachers registered yet — add one from the Add Teacher page." : "No teachers match your filters."}
              </p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    {["Employee No.", "Name", "Gender", "Department", "Subjects", "Classes", "Phone", "Status"].map((h) => (
                      <th key={h} style={{ padding: "12px 14px", textAlign: "left", color: "#94a3b8", fontWeight: 700, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                        {h}
                      </th>
                    ))}
                    <th style={{ padding: "12px 14px", textAlign: "right", color: "#94a3b8", fontWeight: 700, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid #f1f5f9", opacity: busyId === t.id ? 0.5 : 1 }}>
                      <td style={{ padding: "13px 14px", color: "#3b82f6", fontWeight: 600 }}>{t.employeeNo}</td>
                      <td style={{ padding: "13px 14px", fontWeight: 600, color: "#0f172a" }}>{t.name}</td>
                      <td style={{ padding: "13px 14px", color: "#334155" }}>{t.gender}</td>
                      <td style={{ padding: "13px 14px", color: "#334155" }}>{t.department}</td>
                      <td style={{ padding: "13px 14px", color: "#334155", maxWidth: 180 }} title={joinOrDash(t.subjects)}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{joinOrDash(t.subjects)}</span>
                      </td>
                      <td style={{ padding: "13px 14px", color: "#334155", maxWidth: 140 }} title={joinOrDash(t.classes)}>
                        <span style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{joinOrDash(t.classes)}</span>
                      </td>
                      <td style={{ padding: "13px 14px", color: "#334155" }}>{t.phone}</td>
                      <td style={{ padding: "13px 14px" }}><StatusBadge status={t.employmentStatus} /></td>
                      <td style={{ padding: "13px 14px", textAlign: "right" as const }}>
                        <ActionsMenu onAction={(kind) => handleAction(kind, t)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #f1f5f9", flexWrap: "wrap" as const, gap: 12 }}>
              <span style={{ fontSize: 12.5, color: "#64748b" }}>
                Showing {startIdx + 1}-{Math.min(startIdx + rowsPerPage, filtered.length)} of {filtered.length} teachers
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#64748b" }}>
                  Rows per page:
                  <FilterSelect value={String(rowsPerPage)} onChange={(v) => { setRowsPerPage(Number(v)); setPage(1); }} options={ROWS_PER_PAGE_OPTIONS.map(String)} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button onClick={() => setPage(1)} disabled={currentPage === 1} style={{ padding: 6, border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: currentPage === 1 ? "not-allowed" : "pointer", color: "#64748b", display: "flex" }}><ChevronsLeft size={14} /></button>
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: 6, border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: currentPage === 1 ? "not-allowed" : "pointer", color: "#64748b", display: "flex" }}><ChevronLeft size={14} /></button>
                  <span style={{ fontSize: 12.5, color: "#334155", padding: "0 6px" }}>{currentPage} / {totalPages}</span>
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: 6, border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: currentPage === totalPages ? "not-allowed" : "pointer", color: "#64748b", display: "flex" }}><ChevronRight size={14} /></button>
                  <button onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} style={{ padding: 6, border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: currentPage === totalPages ? "not-allowed" : "pointer", color: "#64748b", display: "flex" }}><ChevronsRight size={14} /></button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal?.kind === "profile" && (
        <ModalShell title="Teacher Profile" onClose={() => setModal(null)} width={480}>
          <InfoRow label="Employee No." value={modal.teacher.employeeNo} />
          <InfoRow label="Name" value={modal.teacher.name} />
          <InfoRow label="Gender" value={modal.teacher.gender} />
          <InfoRow label="Phone" value={modal.teacher.phone} />
          <InfoRow label="Email" value={modal.teacher.email} />
          <InfoRow label="Address" value={modal.teacher.address} />
          <InfoRow label="Nationality" value={modal.teacher.nationality} />
          <InfoRow label="Department" value={modal.teacher.department} />
          <InfoRow label="Position" value={modal.teacher.position} />
          <InfoRow label="Employment Type" value={modal.teacher.employmentType} />
          <InfoRow label="Employment Status" value={modal.teacher.employmentStatus} />
          <InfoRow label="Date of Joining" value={formatDate(modal.teacher.dateOfJoining)} />
          <InfoRow label="Highest Qualification" value={modal.teacher.highestQualification} />
          <InfoRow label="Institution" value={modal.teacher.institution} />
          <InfoRow label="Specialization" value={modal.teacher.specialization} />
          <InfoRow label="Years of Experience" value={modal.teacher.yearsOfExperience} />
          <InfoRow label="Class Teacher" value={modal.teacher.classTeacher ? "Yes" : "No"} />
        </ModalShell>
      )}

      {modal?.kind === "subjects" && (
        <ModalShell title="Assigned Subjects" onClose={() => setModal(null)} width={380}>
          {modal.teacher.subjects.length === 0 ? (
            <p style={{ fontSize: 13.5, color: "#94a3b8" }}>No subjects assigned yet.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
              {modal.teacher.subjects.map((s) => (
                <span key={s} style={{ background: "#eff6ff", color: "#3b82f6", fontSize: 12.5, fontWeight: 600, padding: "5px 12px", borderRadius: 20, border: "1px solid #bfdbfe" }}>{s}</span>
              ))}
            </div>
          )}
        </ModalShell>
      )}

      {modal?.kind === "classes" && (
        <ModalShell title="Assigned Classes" onClose={() => setModal(null)} width={380}>
          {modal.teacher.classes.length === 0 ? (
            <p style={{ fontSize: 13.5, color: "#94a3b8" }}>No classes assigned yet.</p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: modal.teacher.streams ? 14 : 0 }}>
              {modal.teacher.classes.map((c) => (
                <span key={c} style={{ background: "#f0fdf4", color: "#10b981", fontSize: 12.5, fontWeight: 600, padding: "5px 12px", borderRadius: 20, border: "1px solid #bbf7d0" }}>{c}</span>
              ))}
            </div>
          )}
          {modal.teacher.streams && <InfoRow label="Streams" value={modal.teacher.streams} />}
          <InfoRow label="Class Teacher" value={modal.teacher.classTeacher ? "Yes" : "No"} />
        </ModalShell>
      )}

      {modal?.kind === "attendance" && (
        <ModalShell title="Attendance History" onClose={() => setModal(null)} width={380}>
          <div style={{ textAlign: "center", padding: "20px 0", color: "#94a3b8" }}>
            <ClipboardList size={26} style={{ marginBottom: 10 }} />
            <p style={{ margin: 0, fontSize: 13.5 }}>No attendance records available yet for {modal.teacher.name}.</p>
          </div>
        </ModalShell>
      )}

      {modal?.kind === "account" && (
        <AccountModal teacher={modal.teacher} onClose={() => setModal(null)} onSave={(patch) => updateTeacher(modal.teacher.id, { account: patch })} />
      )}

      {modal?.kind === "edit" && (
        <EditTeacherDialog teacher={modal.teacher} onClose={() => setModal(null)} onSave={(patch) => updateTeacher(modal.teacher.id, patch)} />
      )}
    </div>
  );
}

// ── helpers for optimistic local update ───────────────────────────────────────

function toRaw(t: TeacherRow) {
  return {
    teacherId: t.employeeNo,
    firstName: t.name, lastName: "",
    gender: t.gender, department: t.department, position: t.position,
    subjectsTaught: t.subjects, assignedClasses: t.classes, assignedStreams: t.streams,
    phoneNumber: t.phone, email: t.email, address: t.address, nationality: t.nationality,
    employmentType: t.employmentType, employmentStatus: t.employmentStatus, dateOfJoining: t.dateOfJoining,
    highestQualification: t.highestQualification, institution: t.institution, specialization: t.specialization,
    yearsOfExperience: t.yearsOfExperience, classTeacher: t.classTeacher, account: t.account,
  };
}

// ── Edit dialog ──────────────────────────────────────────────────────────────

function EditTeacherDialog({
  teacher, onClose, onSave,
}: { teacher: TeacherRow; onClose: () => void; onSave: (patch: any) => Promise<void> }) {
  const [name, setName] = useState(teacher.name);
  const [phone, setPhone] = useState(teacher.phone === "—" ? "" : teacher.phone);
  const [email, setEmail] = useState(teacher.email === "—" ? "" : teacher.email);
  const [department, setDepartment] = useState(teacher.department === "—" ? "" : teacher.department);
  const [position, setPosition] = useState(teacher.position === "—" ? "" : teacher.position);
  const [status, setStatus] = useState(teacher.employmentStatus);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({ firstName: name.trim(), lastName: "", phoneNumber: phone.trim(), email: email.trim(), department: department.trim(), position: position.trim(), employmentStatus: status });
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to update teacher.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Edit Teacher" onClose={onClose} width={420}>
      <FieldInput label="Full Name" value={name} onChange={setName} />
      <FieldInput label="Phone Number" value={phone} onChange={setPhone} icon={<Phone size={14} />} />
      <FieldInput label="Email Address" value={email} onChange={setEmail} icon={<Mail size={14} />} />
      <FieldInput label="Department" value={department} onChange={setDepartment} />
      <FieldInput label="Position/Designation" value={position} onChange={setPosition} />
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6, display: "block" }}>Employment Status</label>
        <div style={{ position: "relative" }}>
          <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13.5, color: "#0f172a", outline: "none", appearance: "none" as const, cursor: "pointer", boxSizing: "border-box" as const }}>
            {["Active", "On Leave", "Suspended", "Inactive"].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <ChevronDown size={15} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
        <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#334155", cursor: "pointer" }}>Cancel</button>
        <button disabled={saving || !name.trim()} onClick={handleSave} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </ModalShell>
  );
}

// ── Account modal ────────────────────────────────────────────────────────────

function AccountModal({
  teacher, onClose, onSave,
}: { teacher: TeacherRow; onClose: () => void; onSave: (patch: any) => Promise<void> }) {
  const [username, setUsername] = useState(teacher.account?.username ?? "");
  const [email, setEmail] = useState(teacher.account?.email ?? teacher.email === "—" ? "" : (teacher.account?.email ?? teacher.email));
  const [role, setRole] = useState(teacher.account?.role ?? "Teacher");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!username.trim() || !email.trim()) return;
    setSaving(true);
    try {
      const patch: any = { username: username.trim(), email: email.trim(), role };
      if (password.trim()) patch.password = password.trim();
      await onSave(patch);
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to update account.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell title="Manage Account" onClose={onClose} width={420}>
      {!teacher.account && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 8, padding: "10px 12px", fontSize: 12.5, color: "#a16207", marginBottom: 16 }}>
          No login account exists for this teacher yet. Fill in the details below to create one.
        </div>
      )}
      <FieldInput label="Username" value={username} onChange={setUsername} icon={<KeyRound size={14} />} />
      <FieldInput label="Email" value={email} onChange={setEmail} icon={<Mail size={14} />} />
      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6, display: "block" }}>Role</label>
        <div style={{ position: "relative" }}>
          <select value={role} onChange={(e) => setRole(e.target.value)} style={{ width: "100%", padding: "10px 14px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13.5, color: "#0f172a", outline: "none", appearance: "none" as const, cursor: "pointer", boxSizing: "border-box" as const }}>
            {["Teacher", "Head of Department", "Administrator"].map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <ChevronDown size={15} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
        </div>
      </div>
      <FieldInput label={teacher.account ? "Reset Password (optional)" : "Password"} value={password} onChange={setPassword} icon={<KeyRound size={14} />} />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
        <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#334155", cursor: "pointer" }}>Cancel</button>
        <button disabled={saving || !username.trim() || !email.trim()} onClick={handleSave} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Saving..." : teacher.account ? "Update Account" : "Create Account"}
        </button>
      </div>
    </ModalShell>
  );
}
