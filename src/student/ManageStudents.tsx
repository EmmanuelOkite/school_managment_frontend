import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { studentService } from "../api/studentService";
import {
  Search, ChevronDown, Upload, Download, Plus, Eye, Pencil, MoreVertical,
  Phone, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight, AlertCircle, Users,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface StudentRow {
  id: string;
  admissionNo: string;
  name: string;
  gender: string;
  age: string;
  className: string;
  stream: string;
  parentName: string;
  parentPhone: string;
  status: string;
  admissionDate: string;
}

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 100];
const FLAGGED_STATUSES = ["transferred", "expelled", "withdrawn"];

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(value?: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function normalizeStudent(raw: any): StudentRow {
  const name =
    [raw.firstName, raw.surname ?? raw.lastName, raw.otherNames].filter(Boolean).join(" ").trim() ||
    raw.name || "Unnamed Student";

  return {
    id: String(raw._id ?? raw.id ?? raw.studentId ?? name),
    admissionNo: String(raw.admissionNo ?? raw.admissionNumber ?? raw.studentId ?? "—"),
    name,
    gender: raw.gender ?? "—",
    age: raw.age != null && raw.age !== "" ? String(raw.age) : "—",
    className: raw.class ?? raw.className ?? raw.level ?? "—",
    stream: raw.stream ?? raw.section ?? "—",
    parentName: raw.parentName ?? raw.guardianName ?? raw.parent?.name ?? "—",
    parentPhone: raw.parentPhone ?? raw.guardianPhone ?? raw.parent?.phone ?? "",
    status: raw.status ?? "Active",
    admissionDate: raw.admissionDate ?? raw.createdAt ?? "",
  };
}

// ── Small pieces ─────────────────────────────────────────────────────────────

function StatusLabel({ status }: { status: string }) {
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
  return <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{status}</span>;
}

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
          appearance: "none" as const, cursor: "pointer", minWidth: 130,
        }}
      >
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown size={14} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ManageStudents({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();

  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("All Classes");
  const [streamFilter, setStreamFilter] = useState("All Streams");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const loadStudents = () => {
    setLoading(true);
    setError(null);
    studentService.getAll()
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.students ?? res.data?.data ?? [];
        setStudents(raw.map(normalizeStudent));
      })
      .catch((err) => {
        setError(err.response?.data?.message ?? "Failed to load students. Please try again.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadStudents(); }, []);

  const classOptions = useMemo(
    () => ["All Classes", ...Array.from(new Set(students.map((s) => s.className).filter((c) => c && c !== "—")))],
    [students]
  );
  const streamOptions = useMemo(
    () => ["All Streams", ...Array.from(new Set(students.map((s) => s.stream).filter((s) => s && s !== "—")))],
    [students]
  );
  const statusOptions = useMemo(
    () => ["All Status", ...Array.from(new Set(students.map((s) => s.status).filter(Boolean)))],
    [students]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return students.filter((s) => {
      if (classFilter !== "All Classes" && s.className !== classFilter) return false;
      if (streamFilter !== "All Streams" && s.stream !== streamFilter) return false;
      if (statusFilter !== "All Status" && s.status !== statusFilter) return false;
      if (q && !(
        s.name.toLowerCase().includes(q) ||
        s.admissionNo.toLowerCase().includes(q) ||
        s.parentName.toLowerCase().includes(q)
      )) return false;
      return true;
    });
  }, [students, search, classFilter, streamFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * rowsPerPage;
  const pageRows = filtered.slice(startIdx, startIdx + rowsPerPage);

  const allOnPageSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  const toggleAllOnPage = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allOnPageSelected) pageRows.forEach((r) => next.delete(r.id));
      else pageRows.forEach((r) => next.add(r.id));
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const clearFilters = () => {
    setSearch(""); setClassFilter("All Classes"); setStreamFilter("All Streams"); setStatusFilter("All Status"); setPage(1);
  };

  const pageNumbers = useMemo(() => {
    const nums: number[] = [];
    for (let i = 1; i <= totalPages; i++) nums.push(i);
    return nums;
  }, [totalPages]);

  return (
    <div style={{ minHeight: embedded ? undefined : "100vh", background: embedded ? "transparent" : "#f1f5f9", padding: embedded ? "20px" : "28px 28px", fontFamily: "'Inter', 'Segoe UI', sans-serif", textAlign: "left" as const }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12.5, color: "#94a3b8" }}>Students <span style={{ margin: "0 4px" }}>›</span> Manage Students</p>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "4px 0 0" }}>Manage Students</h1>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#3b82f6", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Upload size={15} /> Bulk Import
            </button>
            <button style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", color: "#334155", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Download size={15} /> Export Data
            </button>
            <button
              onClick={() => navigate("/students/add")}
              style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              <Plus size={15} /> Add Student
            </button>
          </div>
        </div>

        {/* ── Filter bar ────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 18, flexWrap: "wrap" as const }}>
          <div style={{ position: "relative", flex: 1, minWidth: 240 }}>
            <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Filter by Name, Admission #, or Parent..."
              style={{
                width: "100%", padding: "9px 14px 9px 34px", borderRadius: 8,
                border: "1.5px solid #e2e8f0", fontSize: 13, color: "#334155",
                background: "#fff", outline: "none", boxSizing: "border-box" as const,
              }}
            />
          </div>
          <FilterSelect value={classFilter} onChange={(v) => { setClassFilter(v); setPage(1); }} options={classOptions} />
          <FilterSelect value={streamFilter} onChange={(v) => { setStreamFilter(v); setPage(1); }} options={streamOptions} />
          <FilterSelect value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} options={statusOptions} />
          <button onClick={clearFilters} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            Clear Filters
          </button>
        </div>

        {/* ── Table card ────────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>

          {loading && (
            <div style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8", fontSize: 13.5 }}>Loading students…</div>
          )}

          {!loading && error && (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <AlertCircle size={22} color="#ef4444" style={{ marginBottom: 8 }} />
              <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "#ef4444" }}>{error}</p>
              <button onClick={loadStudents} style={{ padding: "8px 18px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8" }}>
              <Users size={28} style={{ marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 13.5 }}>No students found.</p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px", width: 36 }}>
                      <input type="checkbox" checked={allOnPageSelected} onChange={toggleAllOnPage} />
                    </th>
                    {["Admission No", "Student Name", "Gender/Age", "Class/Stream", "Parent/Guardian", "Status", "Admission Date"].map((h) => (
                      <th key={h} style={{ padding: "12px 10px", textAlign: "left", color: "#94a3b8", fontWeight: 700, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                        {h}
                      </th>
                    ))}
                    <th style={{ padding: "12px 16px", textAlign: "right", color: "#94a3b8", fontWeight: 700, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((s) => (
                    <tr key={s.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 16px" }}>
                        <input type="checkbox" checked={selected.has(s.id)} onChange={() => toggleOne(s.id)} />
                      </td>
                      <td style={{ padding: "14px 10px" }}>
                        <span style={{ color: "#3b82f6", fontWeight: 600 }}>{s.admissionNo}</span>
                      </td>
                      <td style={{ padding: "14px 10px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{s.name}</div>
                      </td>
                      <td style={{ padding: "14px 10px", color: "#334155" }}>
                        <div>{s.gender}</div>
                        <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>{s.age !== "—" ? `${s.age} Years` : "—"}</div>
                      </td>
                      <td style={{ padding: "14px 10px", color: "#334155" }}>
                        <div>{s.className}</div>
                        {s.stream !== "—" && <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2 }}>{s.stream}</div>}
                      </td>
                      <td style={{ padding: "14px 10px", color: "#334155" }}>
                        <div style={{ fontWeight: 500, color: "#0f172a" }}>{s.parentName}</div>
                        {s.parentPhone && (
                          <div style={{ fontSize: 11.5, color: "#94a3b8", marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                            <Phone size={11} /> {s.parentPhone}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "14px 10px" }}>
                        <StatusLabel status={s.status} />
                      </td>
                      <td style={{ padding: "14px 10px", color: "#334155" }}>{formatDate(s.admissionDate)}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", color: "#94a3b8" }}>
                          <Eye size={15} style={{ cursor: "pointer" }} />
                          <Pencil size={15} style={{ cursor: "pointer" }} />
                          <MoreVertical size={15} style={{ cursor: "pointer" }} />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination footer ──────────────────────────────────────── */}
          {!loading && !error && filtered.length > 0 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 20px", borderTop: "1px solid #f1f5f9", flexWrap: "wrap" as const, gap: 12 }}>
              <span style={{ fontSize: 12.5, color: "#64748b" }}>
                Showing {startIdx + 1}-{Math.min(startIdx + rowsPerPage, filtered.length)} of {filtered.length} students
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "#64748b" }}>
                  Rows per page:
                  <FilterSelect
                    value={String(rowsPerPage)}
                    onChange={(v) => { setRowsPerPage(Number(v)); setPage(1); }}
                    options={ROWS_PER_PAGE_OPTIONS.map(String)}
                  />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <button onClick={() => setPage(1)} disabled={currentPage === 1} style={{ padding: 6, border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: currentPage === 1 ? "not-allowed" : "pointer", color: "#64748b", display: "flex" }}>
                    <ChevronsLeft size={14} />
                  </button>
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} style={{ padding: 6, border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: currentPage === 1 ? "not-allowed" : "pointer", color: "#64748b", display: "flex" }}>
                    <ChevronLeft size={14} />
                  </button>
                  {pageNumbers.map((n) => (
                    <button
                      key={n}
                      onClick={() => setPage(n)}
                      style={{
                        width: 28, height: 28, borderRadius: 6, border: n === currentPage ? "none" : "1px solid #e2e8f0",
                        background: n === currentPage ? "#3b82f6" : "#fff", color: n === currentPage ? "#fff" : "#334155",
                        fontSize: 12.5, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} style={{ padding: 6, border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: currentPage === totalPages ? "not-allowed" : "pointer", color: "#64748b", display: "flex" }}>
                    <ChevronRight size={14} />
                  </button>
                  <button onClick={() => setPage(totalPages)} disabled={currentPage === totalPages} style={{ padding: 6, border: "1px solid #e2e8f0", borderRadius: 6, background: "#fff", cursor: currentPage === totalPages ? "not-allowed" : "pointer", color: "#64748b", display: "flex" }}>
                    <ChevronsRight size={14} />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
