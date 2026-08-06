import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { announcementService } from "../api/announcementService";
import { studentService } from "../api/studentService";
import {
  Info, Calendar, Upload, X, FileText, Eye, User, Building2, ChevronDown,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  title: string;
  category: string;
  message: string;
  audience: string;
  classId: string;
  publishDate: string;
  expiryDate: string;
  priority: string;
  status: string;
  postedBy: string;
  role: string;
  department: string;
}

interface FieldError {
  [key: string]: string;
}

// ── Options ──────────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = ["Academic", "Examination", "Finance", "Events", "Sports", "General", "Emergency"];
const AUDIENCE_OPTIONS = ["All Users", "Students", "Teachers", "Parents", "Staff"];
const PRIORITY_OPTIONS = ["Low", "Normal", "High", "Urgent"];
const STATUS_OPTIONS = ["Draft", "Published", "Scheduled", "Archived"];
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const AVATAR_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#f97316", "#06b6d4"];

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function audienceInfo(audience: string, classLabel: string): string {
  const base: Record<string, string> = {
    "All Users": "The announcement will be visible to all registered system users.",
    "Students": "The announcement will be visible to students only.",
    "Teachers": "The announcement will be visible to teaching staff only.",
    "Parents": "The announcement will be visible to parents/guardians only.",
    "Staff": "The announcement will be visible to non-teaching staff only.",
  };
  const text = base[audience] ?? "Select an audience to see visibility details.";
  return classLabel ? `${text} Restricted to ${classLabel}.` : text;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
}

function avatarColor(name: string): string {
  if (!name) return "#94a3b8";
  const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ── Small pieces ─────────────────────────────────────────────────────────────

function SectionHeader({ title, color }: { title: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
      <div style={{ width: 3, height: 16, background: color, borderRadius: 2 }} />
      <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{title}</span>
    </div>
  );
}

function Label({ text }: { text: string }) {
  return <label style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginBottom: 6, display: "block" }}>{text}</label>;
}

function ErrorMsg({ msg }: { msg: string }) {
  return <p style={{ margin: "5px 0 0", fontSize: 12, color: "#ef4444" }}>{msg}</p>;
}

function TextInput({
  value, onChange, placeholder, error,
}: { value: string; onChange: (v: string) => void; placeholder: string; error?: string }) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", padding: "10px 14px", borderRadius: 8,
        border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
        fontSize: 13.5, color: "#0f172a", background: "#fff",
        outline: "none", boxSizing: "border-box" as const,
      }}
    />
  );
}

function DateInput({
  value, onChange, error,
}: { value: string; onChange: (v: string) => void; error?: string }) {
  return (
    <div style={{ position: "relative" }}>
      <Calendar size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
      <input
        type="date" value={value} onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 14px 10px 34px", borderRadius: 8,
          border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
          fontSize: 13.5, color: "#0f172a", background: "#fff",
          outline: "none", boxSizing: "border-box" as const,
        }}
      />
    </div>
  );
}

function SelectField({
  value, onChange, options, placeholder, error,
}: { value: string; onChange: (v: string) => void; options: string[]; placeholder: string; error?: string }) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 36px 10px 14px", borderRadius: 8,
          border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
          fontSize: 13.5, color: value ? "#0f172a" : "#94a3b8", background: "#fff",
          outline: "none", appearance: "none" as const, cursor: "pointer",
          boxSizing: "border-box" as const,
        }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
      </select>
      <ChevronDown size={15} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", color: "#94a3b8", pointerEvents: "none" }} />
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export default function CreateAnnouncement() {
  const navigate = useNavigate();

  const [form, setForm] = useState<FormData>({
    title: "", category: "", message: "", audience: "All Users", classId: "",
    publishDate: todayIso(), expiryDate: "", priority: "Normal", status: "Draft",
    postedBy: "", role: "Administrator", department: "",
  });
  const [errors, setErrors] = useState<FieldError>({});
  const [attachments, setAttachments] = useState<File[]>([]);
  const [classOptions, setClassOptions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    studentService.getAll()
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : res.data?.students ?? res.data?.data ?? [];
        const classes = Array.from(new Set(raw.map((s: any) => s.class ?? s.className ?? s.level).filter(Boolean))) as string[];
        setClassOptions(classes);
      })
      .catch(() => { /* class list is a nicety here; form still works without it */ });
  }, []);

  const set = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const showClassField = form.audience === "All Users" || form.audience === "Students";

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    const accepted: File[] = [];
    for (const file of Array.from(files)) {
      if (file.size > MAX_FILE_BYTES) {
        alert(`"${file.name}" exceeds the 10MB limit and was not attached.`);
        continue;
      }
      accepted.push(file);
    }
    setAttachments((prev) => [...prev, ...accepted]);
  };

  const removeFile = (idx: number) => setAttachments((prev) => prev.filter((_, i) => i !== idx));

  const validate = (forPublish: boolean): boolean => {
    const e: FieldError = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (forPublish) {
      if (!form.category) e.category = "Please select a category";
      if (!form.message.trim()) e.message = "Description/message is required";
      if (!form.publishDate) e.publishDate = "Publish date is required";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildPayload = (status: string): FormData & { attachmentCount: number } => ({
    ...form, status, attachmentCount: attachments.length,
  });

  const submit = async (status: string, forPublish: boolean) => {
    if (!validate(forPublish)) return;
    setSaving(true);
    try {
      let payload: any = buildPayload(status);
      if (attachments.length > 0) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => fd.append(k, String(v)));
        attachments.forEach((file) => fd.append("attachments", file));
        payload = fd;
      }
      await announcementService.create(payload);
      alert(status === "Draft" ? "Draft saved successfully!" : "Announcement published successfully!");
      setForm((prev) => ({ ...prev, status }));
    } catch (err: any) {
      alert(err.response?.data?.message ?? "Failed to save announcement.");
    } finally {
      setSaving(false);
    }
  };

  const classLabel = showClassField ? form.classId : "";
  const priorityColor = (p: string) => (p === "Urgent" ? "#ef4444" : "#0f172a");

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9", padding: "28px 24px", fontFamily: "'Inter', 'Segoe UI', sans-serif", textAlign: "left" as const }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* ── Card ──────────────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>

          {/* Header */}
          <div style={{ padding: "22px 28px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "flex-start", background: "#f8fafc" }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: 0 }}>Create New Announcement</h1>
              <p style={{ fontSize: 13, color: "#64748b", margin: "6px 0 0" }}>Draft and broadcast school-wide or class-specific notifications.</p>
            </div>
            <span style={{ background: "#e2e8f0", color: "#475569", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20, letterSpacing: "0.05em" }}>
              {form.status.toUpperCase()}
            </span>
          </div>

          <div style={{ padding: "28px" }}>

            {/* ── Basic Information ────────────────────────────────────── */}
            <SectionHeader title="Basic Information" color="#6366f1" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 18 }}>
              <div>
                <Label text="Title" />
                <TextInput value={form.title} onChange={(v) => set("title", v)} placeholder="e.g. Mid-Term Examination Schedule" error={errors.title} />
                {errors.title && <ErrorMsg msg={errors.title} />}
              </div>
              <div>
                <Label text="Category" />
                <SelectField value={form.category} onChange={(v) => set("category", v)} options={CATEGORY_OPTIONS} placeholder="Select category" error={errors.category} />
                {errors.category && <ErrorMsg msg={errors.category} />}
              </div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <Label text="Description / Message" />
              <textarea
                value={form.message}
                onChange={(e) => set("message", e.target.value)}
                placeholder="Enter the full content of the announcement here..."
                rows={5}
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: 8,
                  border: `1.5px solid ${errors.message ? "#ef4444" : "#e2e8f0"}`,
                  fontSize: 13.5, color: "#0f172a", background: "#fff",
                  outline: "none", resize: "vertical" as const, boxSizing: "border-box" as const,
                  fontFamily: "inherit",
                }}
              />
              {errors.message && <ErrorMsg msg={errors.message} />}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 28 }}>
              <Info size={13} color="#94a3b8" />
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Provide detailed information for the recipients.</span>
            </div>

            {/* ── Audience + Schedule ──────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginBottom: 28 }}>
              <div>
                <SectionHeader title="Audience" color="#06b6d4" />
                <div style={{ marginBottom: 14 }}>
                  <Label text="Target Recipients" />
                  <SelectField value={form.audience} onChange={(v) => set("audience", v)} options={AUDIENCE_OPTIONS} placeholder="Select audience" />
                </div>
                {showClassField && (
                  <div style={{ marginBottom: 14 }}>
                    <Label text="Specific Class (Optional)" />
                    <SelectField value={form.classId} onChange={(v) => set("classId", v)} options={classOptions} placeholder="All Classes" />
                  </div>
                )}
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 8, padding: "10px 12px", fontSize: 12.5, color: "#3b82f6", lineHeight: 1.5 }}>
                  {audienceInfo(form.audience, classLabel)}
                </div>
              </div>

              <div>
                <SectionHeader title="Schedule" color="#6366f1" />
                <div style={{ marginBottom: 14 }}>
                  <Label text="Publish Date" />
                  <DateInput value={form.publishDate} onChange={(v) => set("publishDate", v)} error={errors.publishDate} />
                  {errors.publishDate && <ErrorMsg msg={errors.publishDate} />}
                </div>
                <div>
                  <Label text="Expiry Date (Optional)" />
                  <DateInput value={form.expiryDate} onChange={(v) => set("expiryDate", v)} />
                </div>
              </div>
            </div>

            {/* ── Options + Attachments ────────────────────────────────── */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginBottom: 28 }}>
              <div>
                <SectionHeader title="Options" color="#6366f1" />
                <div style={{ marginBottom: 16 }}>
                  <Label text="Priority Level" />
                  <div style={{ display: "flex", gap: 18, flexWrap: "wrap" as const }}>
                    {PRIORITY_OPTIONS.map((p) => (
                      <label key={p} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, color: priorityColor(p), fontWeight: p === "Urgent" ? 600 : 400 }}>
                        <input type="radio" name="priority" checked={form.priority === p} onChange={() => set("priority", p)} style={{ accentColor: "#3b82f6", cursor: "pointer" }} />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label text="Current Status" />
                  <SelectField value={form.status} onChange={(v) => set("status", v)} options={STATUS_OPTIONS} placeholder="Select status" />
                </div>
              </div>

              <div>
                <SectionHeader title="Attachments" color="#06b6d4" />
                <label style={{
                  display: "flex", flexDirection: "column" as const, alignItems: "center", justifyContent: "center", gap: 6,
                  border: "1.5px dashed #cbd5e1", borderRadius: 10, padding: "22px 14px",
                  cursor: "pointer", background: "#f8fafc", textAlign: "center" as const,
                }}>
                  <input type="file" multiple hidden onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} accept=".pdf,.png,.jpg,.jpeg,.doc,.docx" />
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: "#e0f2fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Upload size={16} color="#0891b2" />
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#334155" }}>Click to upload or drag and drop</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>PDF, Image, or Word Document (Max. 10MB)</span>
                </label>
                {attachments.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginTop: 12 }}>
                    {attachments.map((file, idx) => (
                      <span key={`${file.name}-${idx}`} style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 20,
                        padding: "5px 10px", fontSize: 12, color: "#334155",
                      }}>
                        <FileText size={13} color="#64748b" />
                        {file.name}
                        <span style={{ color: "#94a3b8", fontSize: 11 }}>({formatBytes(file.size)})</span>
                        <X size={13} style={{ cursor: "pointer", color: "#94a3b8" }} onClick={() => removeFile(idx)} />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Author Info ───────────────────────────────────────────── */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 20 }}>
              <p style={{ margin: "0 0 12px", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>Author Info</p>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", gap: 20, flexWrap: "wrap" as const }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 240 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", background: avatarColor(form.postedBy),
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
                    fontSize: 13, fontWeight: 700, flexShrink: 0,
                  }}>
                    {initials(form.postedBy || "?")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Posted By</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <User size={13} color="#94a3b8" />
                      <input
                        value={form.postedBy}
                        onChange={(e) => set("postedBy", e.target.value)}
                        placeholder="Enter your name"
                        style={{ border: "none", outline: "none", background: "transparent", fontSize: 13.5, fontWeight: 600, color: "#0f172a", width: 150 }}
                      />
                      <span style={{ fontSize: 13, color: "#64748b" }}>({form.role})</span>
                    </div>
                  </div>
                </div>
                <div style={{ minWidth: 200 }}>
                  <p style={{ margin: "0 0 4px", fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.04em" }}>Department (Optional)</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Building2 size={13} color="#94a3b8" />
                    <input
                      value={form.department}
                      onChange={(e) => set("department", e.target.value)}
                      placeholder="e.g. Academic Affairs"
                      style={{ border: "none", outline: "none", background: "transparent", fontSize: 13.5, color: "#0f172a", width: 160 }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Live preview ──────────────────────────────────────────── */}
            {showPreview && (
              <div style={{ marginTop: 20, background: "#fefce8", border: "1px solid #fde68a", borderRadius: 10, padding: "16px 18px" }}>
                <p style={{ margin: "0 0 6px", fontSize: 11, fontWeight: 700, color: "#a16207", textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>Preview</p>
                <p style={{ margin: "0 0 4px", fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{form.title || "Untitled Announcement"}</p>
                <p style={{ margin: "0 0 8px", fontSize: 12, color: "#64748b" }}>{form.category || "No category"} · {form.priority} priority · For {form.audience}{classLabel ? ` (${classLabel})` : ""}</p>
                <p style={{ margin: 0, fontSize: 13, color: "#334155", whiteSpace: "pre-wrap" as const }}>{form.message || "No message content yet."}</p>
              </div>
            )}
          </div>

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <div style={{ padding: "18px 28px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 12 }}>
            <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", fontSize: 13.5, fontWeight: 600, padding: 0 }}>
              Cancel
            </button>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
              <button onClick={() => setShowPreview((p) => !p)} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13.5, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                <Eye size={14} /> {showPreview ? "Hide Preview" : "Preview"}
              </button>
              <button disabled={saving} onClick={() => submit("Draft", false)} style={{ padding: "10px 22px", borderRadius: 8, border: "1.5px solid #e2e8f0", background: "#fff", fontSize: 13.5, fontWeight: 600, color: "#334155", cursor: saving ? "not-allowed" : "pointer" }}>
                Save Draft
              </button>
              <button disabled={saving} onClick={() => submit("Published", true)} style={{ padding: "10px 26px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#3b82f6,#6366f1)", fontSize: 13.5, fontWeight: 600, color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>
                Publish Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
