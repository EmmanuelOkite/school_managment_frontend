import { useEffect, useMemo, useState } from "react";
import { studentService } from "../api/studentService";
import {
  Search, Pencil, Trash2, Users, AlertCircle, X, MapPin, User,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface ParentRow {
  studentId: string;
  parentName: string;
  address: string;
  childName: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function normalizeParentRow(raw: any): ParentRow | null {
  const parentName = raw.parentName ?? raw.guardianName ?? raw.parent?.name ?? "";
  if (!parentName.trim()) return null;

  const childName =
    [raw.firstName, raw.surname ?? raw.lastName, raw.otherNames].filter(Boolean).join(" ").trim() ||
    raw.name || "Unnamed Student";

  return {
    studentId: String(raw._id ?? raw.id ?? raw.studentId ?? childName),
    parentName,
    address: raw.address ?? raw.parentAddress ?? raw.homeAddress ?? "—",
    childName,
  };
}

// ── Edit dialog ──────────────────────────────────────────────────────────────

function EditParentDialog({
  row, onClose, onSave,
}: { row: ParentRow; onClose: () => void; onSave: (parentName: string, address: string) => Promise<void> }) {
  const [parentName, setParentName] = useState(row.parentName);
  const [address, setAddress] = useState(row.address === "—" ? "" : row.address);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); onClose(); }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [onClose]);

  const handleSave = async () => {
    if (!parentName.trim()) return;
    setSaving(true);
    try {
      await onSave(parentName.trim(), address.trim());
      onClose();
    } finally {
      setSaving(false);
    }
  };

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
        style={{ width: "100%", maxWidth: 420, background: "#fff", borderRadius: 14, boxShadow: "0 20px 60px rgba(0,0,0,0.3)", padding: 24 }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Edit Parent Info</p>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}>
            <X size={18} />
          </button>
        </div>
        <p style={{ margin: "0 0 16px", fontSize: 12.5, color: "#94a3b8" }}>For child: <strong style={{ color: "#334155" }}>{row.childName}</strong></p>

        <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6, display: "block" }}>Parent Name</label>
        <div style={{ position: "relative", marginBottom: 16 }}>
          <User size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            value={parentName}
            onChange={(e) => setParentName(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 34px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13.5, color: "#0f172a", outline: "none", boxSizing: "border-box" as const }}
          />
        </div>

        <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6, display: "block" }}>Address</label>
        <div style={{ position: "relative", marginBottom: 22 }}>
          <MapPin size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            style={{ width: "100%", padding: "10px 14px 10px 34px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13.5, color: "#0f172a", outline: "none", boxSizing: "border-box" as const }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
            Cancel
          </button>
          <button disabled={saving || !parentName.trim()} onClick={handleSave} style={{ padding: "9px 20px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function ManageParents({ embedded = false }: { embedded?: boolean }) {
  const [rows, setRows] = useState<ParentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [editingRow, setEditingRow] = useState<ParentRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadParents = () => {
    setLoading(true);
    setError(null);
    studentService.getAll()
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.students ?? res.data?.data ?? [];
        setRows(raw.map(normalizeParentRow).filter((r: ParentRow | null): r is ParentRow => r !== null));
      })
      .catch((err) => setError(err.response?.data?.message ?? "Failed to load parents."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadParents(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      r.parentName.toLowerCase().includes(q) ||
      r.childName.toLowerCase().includes(q) ||
      r.address.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const handleSaveEdit = async (parentName: string, address: string) => {
    if (!editingRow) return;
    await studentService.update(editingRow.studentId, { parentName, address });
    setRows((prev) => prev.map((r) => r.studentId === editingRow.studentId ? { ...r, parentName, address: address || "—" } : r));
  };

  const handleDelete = async (row: ParentRow) => {
    if (!window.confirm(`Remove parent info for ${row.childName}? This won't delete the student record.`)) return;
    setBusyId(row.studentId);
    try {
      await studentService.update(row.studentId, { parentName: "", address: "" });
      setRows((prev) => prev.filter((r) => r.studentId !== row.studentId));
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to remove parent info.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div style={{ minHeight: embedded ? undefined : "100vh", background: embedded ? "transparent" : "#f1f5f9", padding: embedded ? "20px" : "28px 28px", fontFamily: "'Inter', 'Segoe UI', sans-serif", textAlign: "left" as const }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ margin: 0, fontSize: 12.5, color: "#94a3b8" }}>Parents <span style={{ margin: "0 4px" }}>›</span> Manage Parents</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "4px 0 0" }}>Manage Parents</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 0" }}>Parent/guardian records, generated automatically from student registrations.</p>
        </div>

        {/* ── Search ────────────────────────────────────────────────────── */}
        <div style={{ position: "relative", marginBottom: 18, maxWidth: 380 }}>
          <Search size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by parent, child, or address..."
            style={{
              width: "100%", padding: "9px 14px 9px 34px", borderRadius: 8,
              border: "1.5px solid #e2e8f0", fontSize: 13, color: "#334155",
              background: "#fff", outline: "none", boxSizing: "border-box" as const,
            }}
          />
        </div>

        {/* ── Table card ────────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>

          {loading && (
            <div style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8", fontSize: 13.5 }}>Loading parents…</div>
          )}

          {!loading && error && (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <AlertCircle size={22} color="#ef4444" style={{ marginBottom: 8 }} />
              <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "#ef4444" }}>{error}</p>
              <button onClick={loadParents} style={{ padding: "8px 18px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                Retry
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div style={{ padding: "60px 0", textAlign: "center", color: "#94a3b8" }}>
              <Users size={28} style={{ marginBottom: 10 }} />
              <p style={{ margin: 0, fontSize: 13.5 }}>
                {rows.length === 0 ? "No parent records yet — add a student with a parent name to see them here." : "No parents match your search."}
              </p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    {["Parent Name", "Address", "Child's Name"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "#94a3b8", fontWeight: 700, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>
                        {h}
                      </th>
                    ))}
                    <th style={{ padding: "12px 16px", textAlign: "right", color: "#94a3b8", fontWeight: 700, fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" as const }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.studentId} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 16px", fontWeight: 600, color: "#0f172a" }}>{r.parentName}</td>
                      <td style={{ padding: "14px 16px", color: "#334155" }}>{r.address}</td>
                      <td style={{ padding: "14px 16px", color: "#334155" }}>{r.childName}</td>
                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", gap: 14, justifyContent: "flex-end" }}>
                          <button
                            onClick={() => setEditingRow(r)}
                            title="Edit"
                            style={{ background: "none", border: "none", cursor: "pointer", color: "#3b82f6", display: "flex" }}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            onClick={() => handleDelete(r)}
                            disabled={busyId === r.studentId}
                            title="Delete"
                            style={{ background: "none", border: "none", cursor: busyId === r.studentId ? "not-allowed" : "pointer", color: "#ef4444", display: "flex" }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <div style={{ padding: "12px 16px", borderTop: "1px solid #f1f5f9", fontSize: 12.5, color: "#64748b" }}>
              Showing {filtered.length} of {rows.length} parent record{rows.length === 1 ? "" : "s"}
            </div>
          )}
        </div>
      </div>

      {editingRow && (
        <EditParentDialog row={editingRow} onClose={() => setEditingRow(null)} onSave={handleSaveEdit} />
      )}
    </div>
  );
}
