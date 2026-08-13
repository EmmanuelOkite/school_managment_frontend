import { useEffect, useMemo, useRef, useState } from "react";
import { gradingScaleService } from "../api/gradingScaleService";
import { gradeRuleService } from "../api/gradeRuleService";
import {
  Plus, Trash2, ChevronDown, Search, AlertCircle, Star, Power,
  MoreVertical, Save, RotateCcw, LayoutTemplate, SlidersHorizontal, Info,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface GradingScaleRow {
  id: string;
  name: string;
  academicYear: string;
  term: string;
  educationLevel: string;
  description: string;
  status: "Active" | "Inactive";
  isDefault: boolean;
}

interface ScaleDraft {
  name: string;
  academicYear: string;
  term: string;
  educationLevel: string;
  description: string;
  status: "Active" | "Inactive";
}

interface GradeRuleRow {
  key: string;
  id: string | null;
  grade: string;
  minimumScore: string;
  maximumScore: string;
  gradePoint: string;
  remark: string;
  result: "Pass" | "Fail" | "";
  description: string;
  status: "Active" | "Inactive";
}

interface FieldError { [key: string]: string; }

// ── Options & constants ──────────────────────────────────────────────────────

const TERM_OPTIONS = ["Term 1", "Term 2", "Term 3"];
const LEVEL_OPTIONS = ["Primary", "Secondary", "A-Level"];
const STATUS_OPTIONS: ("Active" | "Inactive")[] = ["Active", "Inactive"];
const RESULT_OPTIONS: ("Pass" | "Fail")[] = ["Pass", "Fail"];

const STANDARD_TEMPLATE = [
  { grade: "A", minimumScore: "80", maximumScore: "100", gradePoint: "5", remark: "Excellent", result: "Pass" as const },
  { grade: "B", minimumScore: "70", maximumScore: "79", gradePoint: "4", remark: "Very Good", result: "Pass" as const },
  { grade: "C", minimumScore: "60", maximumScore: "69", gradePoint: "3", remark: "Good", result: "Pass" as const },
  { grade: "D", minimumScore: "50", maximumScore: "59", gradePoint: "2", remark: "Satisfactory", result: "Pass" as const },
  { grade: "E", minimumScore: "40", maximumScore: "49", gradePoint: "1", remark: "Needs Improvement", result: "Fail" as const },
  { grade: "F", minimumScore: "0", maximumScore: "39", gradePoint: "0", remark: "Fail", result: "Fail" as const },
];

const BLANK_DRAFT: ScaleDraft = { name: "", academicYear: String(new Date().getFullYear()), term: "", educationLevel: "", description: "", status: "Active" };

const RULE_COLUMNS = [
  { label: "Grade", width: 64 },
  { label: "Min", width: 70 },
  { label: "Max", width: 70 },
  { label: "Point", width: 70 },
  { label: "Remark", width: 170 },
  { label: "Result", width: 100 },
  { label: "Description", width: 170 },
  { label: "Status", width: 56 },
  { label: "", width: 44 },
];
const RULE_TABLE_WIDTH = RULE_COLUMNS.reduce((sum, c) => sum + c.width, 0);

function academicYearOptions(): string[] {
  const y = new Date().getFullYear();
  return [String(y - 1), String(y), String(y + 1)];
}

// ── Normalizers ──────────────────────────────────────────────────────────────

function normalizeScale(raw: any): GradingScaleRow {
  return {
    id: String(raw._id ?? raw.id),
    name: raw.name ?? raw.gradingScaleName ?? "Untitled Grading Scale",
    academicYear: String(raw.academicYear ?? ""),
    term: raw.term ?? "",
    educationLevel: raw.educationLevel ?? raw.level ?? "",
    description: raw.description ?? "",
    status: raw.status === "Inactive" ? "Inactive" : "Active",
    isDefault: Boolean(raw.isDefault ?? raw.default),
  };
}

function normalizeRule(raw: any): GradeRuleRow {
  const id = raw._id ?? raw.id ?? null;
  return {
    key: id ? String(id) : `existing-${Math.random().toString(36).slice(2)}`,
    id: id ? String(id) : null,
    grade: raw.grade ?? "",
    minimumScore: raw.minimumScore != null ? String(raw.minimumScore) : "",
    maximumScore: raw.maximumScore != null ? String(raw.maximumScore) : "",
    gradePoint: raw.gradePoint != null ? String(raw.gradePoint) : "",
    remark: raw.remark ?? "",
    result: raw.result === "Fail" ? "Fail" : raw.result === "Pass" ? "Pass" : "",
    description: raw.description ?? "",
    status: raw.status === "Inactive" ? "Inactive" : "Active",
  };
}

function toRulePayload(row: GradeRuleRow) {
  return {
    id: row.id ?? undefined,
    grade: row.grade.trim(),
    minimumScore: Number(row.minimumScore),
    maximumScore: Number(row.maximumScore),
    gradePoint: Number(row.gradePoint),
    remark: row.remark.trim(),
    result: row.result,
    description: row.description.trim(),
    status: row.status,
  };
}

// ── Small UI pieces ──────────────────────────────────────────────────────────

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
  placeholder, value, onChange, error, type = "text",
}: { placeholder: string; value: string; onChange: (v: string) => void; error?: string; type?: string }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "10px 14px", borderRadius: 8,
        border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
        fontSize: 13.5, color: "#0f172a", background: "#fff", outline: "none", boxSizing: "border-box" as const,
      }}
    />
  );
}

function SelectField({
  placeholder, value, onChange, options, error,
}: { placeholder: string; value: string; onChange: (v: string) => void; options: string[]; error?: string }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 34px 10px 14px", borderRadius: 8,
          border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
          fontSize: 13.5, color: value ? "#0f172a" : "#94a3b8", background: "#fff",
          outline: "none", appearance: "none" as const, cursor: "pointer", boxSizing: "border-box" as const,
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
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

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ flex: 1, minWidth: 150 }}>
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

function DefaultPill() {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10.5, fontWeight: 700,
      letterSpacing: "0.03em", textTransform: "uppercase" as const, padding: "3px 9px", borderRadius: 20,
      color: "#3b82f6", background: "#eff6ff",
    }}>
      <Star size={10} fill="#3b82f6" /> Default
    </span>
  );
}

// ── Scale card actions menu ──────────────────────────────────────────────────

function ScaleActionsMenu({
  scale, busy, onSetDefault, onToggleStatus, onDelete,
}: { scale: GradingScaleRow; busy: boolean; onSetDefault: () => void; onToggleStatus: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }} onClick={(e) => e.stopPropagation()}>
      <button
        disabled={busy}
        onClick={() => setOpen((p) => !p)}
        title="Actions"
        style={{ background: "none", border: "none", cursor: busy ? "not-allowed" : "pointer", color: "#94a3b8", display: "flex", padding: 4 }}
      >
        <MoreVertical size={15} />
      </button>
      {open && (
        <div style={{
          position: "absolute", right: 0, top: "calc(100% + 4px)", background: "#fff",
          border: "1px solid #e2e8f0", borderRadius: 10, boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
          minWidth: 190, zIndex: 60, overflow: "hidden",
        }}>
          {!scale.isDefault && (
            <button onClick={() => { setOpen(false); onSetDefault(); }} style={menuItemStyle()}>
              <Star size={13} /> Set as Default
            </button>
          )}
          <button onClick={() => { setOpen(false); onToggleStatus(); }} style={menuItemStyle()}>
            <Power size={13} /> {scale.status === "Active" ? "Deactivate" : "Activate"}
          </button>
          <button onClick={() => { setOpen(false); onDelete(); }} style={menuItemStyle(true)}>
            <Trash2 size={13} /> Delete Scale
          </button>
        </div>
      )}
    </div>
  );
}

function menuItemStyle(danger = false): React.CSSProperties {
  return {
    width: "100%", display: "flex", alignItems: "center", gap: 9,
    padding: "9px 14px", background: "none", border: "none", cursor: "pointer",
    fontSize: 12.5, color: danger ? "#ef4444" : "#334155", textAlign: "left" as const,
  };
}

// ── Rule row ─────────────────────────────────────────────────────────────────

function RuleRow({
  row, error, onChange, onToggleStatus, onDelete,
}: { row: GradeRuleRow; error?: string; onChange: (patch: Partial<GradeRuleRow>) => void; onToggleStatus: () => void; onDelete: () => void }) {
  const cellStyle: React.CSSProperties = { padding: "8px 10px", borderBottom: "1px solid #f1f5f9" };
  const narrowInput: React.CSSProperties = {
    width: "100%", padding: "7px 9px", borderRadius: 7, border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
    fontSize: 12.5, color: "#0f172a", outline: "none", boxSizing: "border-box" as const,
  };
  const [grade, min, max, point, remark, result, description, status, actions] = RULE_COLUMNS;

  return (
    <tr style={{ opacity: row.status === "Inactive" ? 0.55 : 1 }}>
      <td style={{ ...cellStyle, width: grade.width }}>
        <input value={row.grade} onChange={(e) => onChange({ grade: e.target.value })} placeholder="A" style={{ ...narrowInput, fontWeight: 700, color: "#3b82f6", textAlign: "center" as const }} />
      </td>
      <td style={{ ...cellStyle, width: min.width }}>
        <input type="number" value={row.minimumScore} onChange={(e) => onChange({ minimumScore: e.target.value })} placeholder="0" style={narrowInput} />
      </td>
      <td style={{ ...cellStyle, width: max.width }}>
        <input type="number" value={row.maximumScore} onChange={(e) => onChange({ maximumScore: e.target.value })} placeholder="100" style={narrowInput} />
      </td>
      <td style={{ ...cellStyle, width: point.width }}>
        <input type="number" value={row.gradePoint} onChange={(e) => onChange({ gradePoint: e.target.value })} placeholder="0" style={narrowInput} />
      </td>
      <td style={{ ...cellStyle, width: remark.width }}>
        <input value={row.remark} onChange={(e) => onChange({ remark: e.target.value })} placeholder="e.g. Excellent" style={narrowInput} />
      </td>
      <td style={{ ...cellStyle, width: result.width }}>
        <div style={{ position: "relative" }}>
          <select value={row.result} onChange={(e) => onChange({ result: e.target.value as "Pass" | "Fail" })} style={{ ...narrowInput, appearance: "none" as const, cursor: "pointer", paddingRight: 24, color: row.result ? (row.result === "Pass" ? "#10b981" : "#ef4444") : "#94a3b8", fontWeight: 600 }}>
            <option value="" disabled>Select</option>
            {RESULT_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
          <ChevronDown size={12} style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
        </div>
      </td>
      <td style={{ ...cellStyle, width: description.width }}>
        <input value={row.description} onChange={(e) => onChange({ description: e.target.value })} placeholder="Optional notes" style={narrowInput} />
      </td>
      <td style={{ ...cellStyle, width: status.width, textAlign: "center" as const }}>
        <button onClick={onToggleStatus} title={row.status === "Active" ? "Deactivate rule" : "Activate rule"} style={{ background: "none", border: "none", cursor: "pointer", color: row.status === "Active" ? "#10b981" : "#94a3b8", display: "inline-flex" }}>
          <Power size={14} />
        </button>
      </td>
      <td style={{ ...cellStyle, width: actions.width, textAlign: "center" as const }}>
        <button onClick={onDelete} title="Delete rule" style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444", display: "inline-flex" }}>
          <Trash2 size={14} />
        </button>
      </td>
    </tr>
  );
}

// ── Validation ───────────────────────────────────────────────────────────────

function validateScale(draft: ScaleDraft): FieldError {
  const e: FieldError = {};
  if (!draft.name.trim()) e.name = "Grading scale name is required";
  if (!draft.academicYear) e.academicYear = "Please select an academic year";
  if (!draft.educationLevel) e.educationLevel = "Please select an education level";
  return e;
}

function validateRules(rows: GradeRuleRow[]): { rowErrors: Record<string, string>; globalError: string } {
  const rowErrors: Record<string, string> = {};
  if (rows.length === 0) return { rowErrors, globalError: "Add at least one grade rule before saving." };

  const parsed: { key: string; min: number; max: number }[] = [];
  for (const row of rows) {
    if (!row.grade.trim() || row.minimumScore === "" || row.maximumScore === "" || row.gradePoint === "" || !row.remark.trim() || !row.result) {
      rowErrors[row.key] = "Fill in every field for this grade row";
      continue;
    }
    const min = Number(row.minimumScore), max = Number(row.maximumScore);
    if (min < 0 || max > 100 || min > max) {
      rowErrors[row.key] = "Minimum must be ≤ maximum, within 0–100";
      continue;
    }
    parsed.push({ key: row.key, min, max });
  }

  const sorted = [...parsed].sort((a, b) => a.min - b.min);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].min <= sorted[i - 1].max) {
      rowErrors[sorted[i].key] = rowErrors[sorted[i].key] ?? "This range overlaps another grade band";
      rowErrors[sorted[i - 1].key] = rowErrors[sorted[i - 1].key] ?? "This range overlaps another grade band";
    }
  }

  const globalError = Object.keys(rowErrors).length > 0 ? "Fix the highlighted grade rows before saving." : "";
  return { rowErrors, globalError };
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function GradeManagement({ embedded = false }: { embedded?: boolean }) {
  const [scales, setScales] = useState<GradingScaleRow[]>([]);
  const [loadingScales, setLoadingScales] = useState(true);
  const [scalesError, setScalesError] = useState<string | null>(null);
  const [busyScaleId, setBusyScaleId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState("All Years");
  const [termFilter, setTermFilter] = useState("All Terms");
  const [levelFilter, setLevelFilter] = useState("All Levels");
  const [statusFilter, setStatusFilter] = useState("All Status");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ScaleDraft>(BLANK_DRAFT);
  const [scaleErrors, setScaleErrors] = useState<FieldError>({});

  const [rules, setRules] = useState<GradeRuleRow[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [rulesError, setRulesError] = useState<string | null>(null);
  const [ruleRowErrors, setRuleRowErrors] = useState<Record<string, string>>({});
  const [ruleGlobalError, setRuleGlobalError] = useState<string | null>(null);
  const nextRuleKey = useRef(1);

  const [saving, setSaving] = useState(false);

  const loadScales = () => {
    setLoadingScales(true);
    setScalesError(null);
    gradingScaleService.getAll()
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.gradingScales ?? res.data?.data ?? [];
        setScales(raw.map(normalizeScale));
      })
      .catch((err) => setScalesError(err.response?.data?.message ?? "Failed to load grading scales."))
      .finally(() => setLoadingScales(false));
  };

  useEffect(() => { loadScales(); }, []);

  const academicYearOptionsList = useMemo(
    () => ["All Years", ...Array.from(new Set([...academicYearOptions(), ...scales.map((s) => s.academicYear)])).filter(Boolean).sort()],
    [scales]
  );
  const termOptionsList = useMemo(() => ["All Terms", ...TERM_OPTIONS], []);
  const levelOptionsList = useMemo(() => ["All Levels", ...LEVEL_OPTIONS], []);
  const statusOptionsList = ["All Status", "Active", "Inactive"];

  const filteredScales = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scales.filter((s) => {
      if (academicYearFilter !== "All Years" && s.academicYear !== academicYearFilter) return false;
      if (termFilter !== "All Terms" && s.term !== termFilter) return false;
      if (levelFilter !== "All Levels" && s.educationLevel !== levelFilter) return false;
      if (statusFilter !== "All Status" && s.status !== statusFilter) return false;
      if (q && !s.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [scales, search, academicYearFilter, termFilter, levelFilter, statusFilter]);

  const clearFilters = () => {
    setSearch(""); setAcademicYearFilter("All Years"); setTermFilter("All Terms");
    setLevelFilter("All Levels"); setStatusFilter("All Status");
  };

  const loadRulesForScale = (scaleId: string) => {
    setLoadingRules(true);
    setRulesError(null);
    setRuleRowErrors({});
    setRuleGlobalError(null);
    gradeRuleService.getForScale(scaleId)
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.gradeRules ?? res.data?.data ?? [];
        setRules(raw.map(normalizeRule));
      })
      .catch((err) => setRulesError(err.response?.data?.message ?? "Failed to load grade rules for this scale."))
      .finally(() => setLoadingRules(false));
  };

  const selectScale = (scale: GradingScaleRow) => {
    setSelectedId(scale.id);
    setDraft({ name: scale.name, academicYear: scale.academicYear, term: scale.term, educationLevel: scale.educationLevel, description: scale.description, status: scale.status });
    setScaleErrors({});
    loadRulesForScale(scale.id);
  };

  const startNewScale = () => {
    setSelectedId("new");
    setDraft(BLANK_DRAFT);
    setScaleErrors({});
    setRules([]);
    setRulesError(null);
    setRuleRowErrors({});
    setRuleGlobalError(null);
  };

  const cancelEdit = () => {
    if (selectedId === "new" || !selectedId) { setSelectedId(null); setDraft(BLANK_DRAFT); setRules([]); return; }
    const current = scales.find((s) => s.id === selectedId);
    if (current) selectScale(current);
  };

  const setField = (field: keyof ScaleDraft, value: string) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
    setScaleErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const blankRule = (): GradeRuleRow => ({
    key: `new-${nextRuleKey.current++}`, id: null, grade: "", minimumScore: "", maximumScore: "",
    gradePoint: "", remark: "", result: "", description: "", status: "Active",
  });

  const addRule = () => setRules((prev) => [...prev, blankRule()]);

  const updateRule = (key: string, patch: Partial<GradeRuleRow>) => {
    setRules((prev) => prev.map((r) => r.key === key ? { ...r, ...patch } : r));
    setRuleRowErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const removeRule = (row: GradeRuleRow) => {
    if (row.id) {
      if (!window.confirm(`Delete grade "${row.grade || row.key}"? This cannot be undone.`)) return;
      gradeRuleService.delete(row.id)
        .then(() => setRules((prev) => prev.filter((r) => r.key !== row.key)))
        .catch((err: any) => alert(err.response?.data?.message ?? "Failed to delete grade rule."));
    } else {
      setRules((prev) => prev.filter((r) => r.key !== row.key));
    }
  };

  const toggleRuleStatus = (row: GradeRuleRow) => {
    const newStatus = row.status === "Active" ? "Inactive" : "Active";
    if (row.id) {
      gradeRuleService.update(row.id, { status: newStatus })
        .then(() => setRules((prev) => prev.map((r) => r.key === row.key ? { ...r, status: newStatus } : r)))
        .catch((err: any) => alert(err.response?.data?.message ?? "Failed to update grade rule status."));
    } else {
      setRules((prev) => prev.map((r) => r.key === row.key ? { ...r, status: newStatus } : r));
    }
  };

  const useStandardTemplate = () => {
    if (rules.length > 0 && !window.confirm("This will replace the current grade rows with the standard A–F template. Continue?")) return;
    setRules(STANDARD_TEMPLATE.map((t) => ({ key: `new-${nextRuleKey.current++}`, id: null, description: "", status: "Active" as const, ...t })));
    setRuleRowErrors({});
    setRuleGlobalError(null);
  };

  const handleSaveScale = async () => {
    const sErrs = validateScale(draft);
    setScaleErrors(sErrs);
    const { rowErrors, globalError } = validateRules(rules);
    setRuleRowErrors(rowErrors);
    setRuleGlobalError(globalError || null);
    if (Object.keys(sErrs).length > 0 || globalError) return;

    setSaving(true);
    try {
      const payload = { name: draft.name.trim(), academicYear: draft.academicYear, term: draft.term, educationLevel: draft.educationLevel, description: draft.description.trim(), status: draft.status };
      let scaleId = selectedId;
      if (selectedId === "new") {
        const res = await gradingScaleService.create(payload);
        const created = normalizeScale(res.data?.data ?? res.data?.gradingScale ?? res.data);
        scaleId = created.id;
      } else if (selectedId) {
        await gradingScaleService.update(selectedId, payload);
      }
      if (scaleId) {
        await gradeRuleService.bulkSave(scaleId, rules.map(toRulePayload));
      }
      loadScales();
      if (scaleId) {
        setSelectedId(scaleId);
        loadRulesForScale(scaleId);
      }
      alert("Grading scale saved successfully!");
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to save grading scale.");
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = (scale: GradingScaleRow) => {
    setBusyScaleId(scale.id);
    gradingScaleService.setDefault(scale.id)
      .then(() => setScales((prev) => prev.map((s) => ({ ...s, isDefault: s.id === scale.id }))))
      .catch((err: any) => alert(err.response?.data?.message ?? "Failed to set default grading scale."))
      .finally(() => setBusyScaleId(null));
  };

  const handleToggleScaleStatus = (scale: GradingScaleRow) => {
    const newStatus = scale.status === "Active" ? "Inactive" : "Active";
    setBusyScaleId(scale.id);
    gradingScaleService.update(scale.id, { status: newStatus })
      .then(() => {
        setScales((prev) => prev.map((s) => s.id === scale.id ? { ...s, status: newStatus } : s));
        if (selectedId === scale.id) setDraft((prev) => ({ ...prev, status: newStatus }));
      })
      .catch((err: any) => alert(err.response?.data?.message ?? "Failed to update grading scale status."))
      .finally(() => setBusyScaleId(null));
  };

  const handleDeleteScale = (scale: GradingScaleRow) => {
    if (!window.confirm(`Delete grading scale "${scale.name}"? This also removes its grade rules and cannot be undone.`)) return;
    setBusyScaleId(scale.id);
    gradingScaleService.delete(scale.id)
      .then(() => {
        setScales((prev) => prev.filter((s) => s.id !== scale.id));
        if (selectedId === scale.id) { setSelectedId(null); setDraft(BLANK_DRAFT); setRules([]); }
      })
      .catch((err: any) => alert(err.response?.data?.message ?? "Failed to delete grading scale."))
      .finally(() => setBusyScaleId(null));
  };

  const selectedScale = scales.find((s) => s.id === selectedId) ?? null;
  const isEditing = selectedId !== null;

  return (
    <div style={{ minHeight: embedded ? undefined : "100vh", background: embedded ? "transparent" : "#f1f5f9", padding: embedded ? "20px" : "28px 28px", fontFamily: "'Inter', 'Segoe UI', sans-serif", textAlign: "left" as const }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap" as const, gap: 12 }}>
          <div>
            <p style={{ margin: 0, fontSize: 12.5, color: "#94a3b8" }}>Examinations <span style={{ margin: "0 4px" }}>›</span> Grade Management</p>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", margin: "4px 0 0" }}>Grade Management</h1>
          </div>
          <button
            onClick={startNewScale}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", fontSize: 13.5, fontWeight: 600, color: "#fff", cursor: "pointer" }}
          >
            <Plus size={15} /> New Grading Scale
          </button>
        </div>

        {/* ── Filter bar ────────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", padding: "16px 18px", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" as const, alignItems: "flex-end" }}>
            <div style={{ flex: 1.3, minWidth: 200 }}>
              <label style={{ display: "block", fontSize: 10.5, fontWeight: 700, color: "#94a3b8", letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 6 }}>Search Grading Scale</label>
              <div style={{ position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="e.g. Secondary Standard"
                  style={{ width: "100%", padding: "9px 12px 9px 30px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13, color: "#334155", outline: "none", boxSizing: "border-box" as const }}
                />
              </div>
            </div>
            <FilterField label="Academic Year"><FilterSelect value={academicYearFilter} onChange={setAcademicYearFilter} options={academicYearOptionsList} /></FilterField>
            <FilterField label="Term"><FilterSelect value={termFilter} onChange={setTermFilter} options={termOptionsList} /></FilterField>
            <FilterField label="Education Level"><FilterSelect value={levelFilter} onChange={setLevelFilter} options={levelOptionsList} /></FilterField>
            <FilterField label="Status"><FilterSelect value={statusFilter} onChange={setStatusFilter} options={statusOptionsList} /></FilterField>
            <button onClick={clearFilters} style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 12.5, fontWeight: 600, cursor: "pointer", padding: "9px 0" }}>
              Clear Filters
            </button>
          </div>
        </div>

        {scalesError && (
          <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontSize: 12.5, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px" }}>
            <AlertCircle size={14} /> {scalesError}
            <button onClick={loadScales} style={{ marginLeft: 6, background: "none", border: "none", color: "#3b82f6", fontWeight: 600, cursor: "pointer", fontSize: 12.5 }}>Retry</button>
          </div>
        )}

        {/* ── Content grid ──────────────────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16, alignItems: "flex-start" }}>

          {/* ── Grading scales list ─────────────────────────────────────── */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>
            <div style={{ padding: "14px 16px", borderBottom: "1px solid #f1f5f9" }}>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: "#0f172a" }}>Grading Scales ({filteredScales.length})</p>
            </div>

            {loadingScales && <div style={{ padding: "40px 0", textAlign: "center" as const, color: "#94a3b8", fontSize: 13 }}>Loading…</div>}

            {!loadingScales && filteredScales.length === 0 && (
              <div style={{ padding: "40px 16px", textAlign: "center" as const, color: "#94a3b8" }}>
                <SlidersHorizontal size={22} style={{ marginBottom: 8 }} />
                <p style={{ margin: 0, fontSize: 12.5 }}>
                  {scales.length === 0 ? "No grading scales yet. Create one to get started." : "No grading scales match your filters."}
                </p>
              </div>
            )}

            {!loadingScales && filteredScales.map((s) => (
              <div
                key={s.id}
                onClick={() => selectScale(s)}
                style={{
                  padding: "14px 16px", borderBottom: "1px solid #f1f5f9", cursor: "pointer",
                  background: selectedId === s.id ? "#eff6ff" : "#fff",
                  opacity: busyScaleId === s.id ? 0.5 : 1,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</p>
                    <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "#94a3b8" }}>
                      {s.educationLevel || "—"} · {s.academicYear || "—"}{s.term ? ` · ${s.term}` : ""}
                    </p>
                  </div>
                  <ScaleActionsMenu
                    scale={s}
                    busy={busyScaleId === s.id}
                    onSetDefault={() => handleSetDefault(s)}
                    onToggleStatus={() => handleToggleScaleStatus(s)}
                    onDelete={() => handleDeleteScale(s)}
                  />
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" as const }}>
                  {s.isDefault && <DefaultPill />}
                  <StatusPill status={s.status} />
                </div>
              </div>
            ))}
          </div>

          {/* ── Details / editor panel ───────────────────────────────────── */}
          <div style={{ background: "#fff", borderRadius: 12, border: "1px solid #e2e8f0", overflow: "hidden" }}>

            {!isEditing ? (
              <div style={{ padding: "70px 20px", textAlign: "center" as const, color: "#94a3b8" }}>
                <LayoutTemplate size={26} style={{ marginBottom: 10 }} />
                <p style={{ margin: 0, fontSize: 13.5 }}>Select a grading scale on the left to view or edit it, or create a new one.</p>
              </div>
            ) : (
              <>
                <div style={{ padding: "18px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 10 }}>
                  <div>
                    <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#3b82f6" }}>
                      {selectedId === "new" ? "Create Grading Scale" : "Edit Grading Scale"}
                    </p>
                    <p style={{ margin: "3px 0 0", fontSize: 12, color: "#94a3b8" }}>Define scale details, then configure its grade rules below.</p>
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    {selectedScale?.isDefault && <DefaultPill />}
                    <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>
                      <Info size={13} /> Status: {draft.status}
                    </div>
                  </div>
                </div>

                <div style={{ padding: "22px" }}>
                  {/* Scale fields */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 18 }}>
                    <div>
                      <Label text="Grading Scale Name" required />
                      <InputField placeholder="e.g. Uganda Secondary School Grading" value={draft.name} onChange={(v) => setField("name", v)} error={scaleErrors.name} />
                      {scaleErrors.name && <ErrorMsg msg={scaleErrors.name} />}
                    </div>
                    <div>
                      <Label text="Education Level" required />
                      <SelectField placeholder="Select level" value={draft.educationLevel} onChange={(v) => setField("educationLevel", v)} options={LEVEL_OPTIONS} error={scaleErrors.educationLevel} />
                      {scaleErrors.educationLevel && <ErrorMsg msg={scaleErrors.educationLevel} />}
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18, marginBottom: 18 }}>
                    <div>
                      <Label text="Academic Year" required />
                      <SelectField placeholder="Select year" value={draft.academicYear} onChange={(v) => setField("academicYear", v)} options={academicYearOptions()} error={scaleErrors.academicYear} />
                      {scaleErrors.academicYear && <ErrorMsg msg={scaleErrors.academicYear} />}
                    </div>
                    <div>
                      <Label text="Term" />
                      <SelectField placeholder="All Terms" value={draft.term} onChange={(v) => setField("term", v)} options={TERM_OPTIONS} />
                    </div>
                    <div>
                      <Label text="Status" />
                      <SelectField placeholder="Select status" value={draft.status} onChange={(v) => setField("status", v)} options={STATUS_OPTIONS} />
                    </div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <Label text="Description" />
                    <TextArea placeholder="Optional notes about this grading scale..." value={draft.description} onChange={(v) => setField("description", v)} />
                  </div>

                  <div style={{ height: 1, background: "#f1f5f9", margin: "24px 0" }} />

                  {/* Grade rules */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap" as const, gap: 8 }}>
                    <div>
                      <p style={{ margin: 0, fontWeight: 700, fontSize: 13.5, color: "#0f172a" }}>Grade Configuration</p>
                      <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "#94a3b8" }}>Define score bands, points, remarks and outcome for each grade.</p>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={useStandardTemplate} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 7, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#334155", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        <LayoutTemplate size={13} /> Use Standard Template (A–F)
                      </button>
                      <button onClick={addRule} style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", borderRadius: 7, border: "1px solid #bfdbfe", background: "#eff6ff", color: "#3b82f6", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                        <Plus size={13} /> Add Grade
                      </button>
                    </div>
                  </div>

                  {rulesError && (
                    <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontSize: 12.5, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px" }}>
                      <AlertCircle size={13} /> {rulesError}
                    </div>
                  )}
                  {ruleGlobalError && (
                    <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 6, color: "#ef4444", fontSize: 12.5, background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px" }}>
                      <AlertCircle size={13} /> {ruleGlobalError}
                    </div>
                  )}

                  {loadingRules ? (
                    <div style={{ padding: "30px 0", textAlign: "center" as const, color: "#94a3b8", fontSize: 13 }}>Loading grade rules…</div>
                  ) : rules.length === 0 ? (
                    <div style={{ padding: "26px 0", textAlign: "center" as const, color: "#94a3b8", border: "1.5px dashed #e2e8f0", borderRadius: 10 }}>
                      <p style={{ margin: 0, fontSize: 12.5 }}>No grade rules yet. Add one manually or use the standard A–F template.</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 10 }}>
                      <table style={{ width: RULE_TABLE_WIDTH, tableLayout: "fixed" as const, borderCollapse: "collapse", fontSize: 12.5 }}>
                        <thead>
                          <tr style={{ background: "#f8fafc" }}>
                            {RULE_COLUMNS.map((c) => (
                              <th key={c.label || "actions"} style={{ width: c.width, padding: "10px 10px", textAlign: "left" as const, color: "#94a3b8", fontWeight: 700, fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase" as const, whiteSpace: "nowrap" as const }}>{c.label}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {rules.map((row) => (
                            <RuleRow
                              key={row.key}
                              row={row}
                              error={ruleRowErrors[row.key]}
                              onChange={(patch) => updateRule(row.key, patch)}
                              onToggleStatus={() => toggleRuleStatus(row)}
                              onDelete={() => removeRule(row)}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Footer actions */}
                <div style={{ padding: "16px 22px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 12 }}>
                  <button onClick={cancelEdit} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", color: "#f97316", fontSize: 13, fontWeight: 600, padding: 0 }}>
                    <RotateCcw size={14} /> Cancel
                  </button>
                  <div style={{ display: "flex", gap: 10 }}>
                    {selectedScale && !selectedScale.isDefault && (
                      <button onClick={() => handleSetDefault(selectedScale)} disabled={busyScaleId === selectedScale.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                        <Star size={13} /> Set as Default
                      </button>
                    )}
                    {selectedScale && (
                      <button onClick={() => handleDeleteScale(selectedScale)} disabled={busyScaleId === selectedScale.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 16px", borderRadius: 8, border: "1.5px solid #fecaca", background: "#fff", fontSize: 13, fontWeight: 600, color: "#ef4444", cursor: "pointer" }}>
                        <Trash2 size={13} /> Delete
                      </button>
                    )}
                    <button
                      onClick={handleSaveScale}
                      disabled={saving}
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 22px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", fontSize: 13, fontWeight: 600, color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}
                    >
                      <Save size={14} /> {saving ? "Saving…" : "Save Grading Scale"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
