import { useEffect, useState } from "react";
import { teacherService } from "../api/teacherService";
import {
  User, Hash, Phone, Mail, MapPin, Calendar, Globe, Briefcase,
  GraduationCap, BookOpen, ShieldAlert, KeyRound, ChevronDown, X,
  RotateCcw, Info, AlertCircle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface FormData {
  teacherId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  nationality: string;
  phoneNumber: string;
  email: string;
  address: string;

  employmentType: string;
  dateOfJoining: string;
  department: string;
  position: string;
  employmentStatus: string;

  highestQualification: string;
  institution: string;
  specialization: string;
  yearsOfExperience: string;
  certifications: string;

  subjectsTaught: string[];
  assignedClasses: string[];
  assignedStreams: string;
  classTeacher: string;

  emergencyContactName: string;
  emergencyRelationship: string;
  emergencyPhone: string;
  emergencyAddress: string;

  createAccount: boolean;
  username: string;
  accountEmail: string;
  role: string;
  password: string;
}

interface FieldError {
  [key: string]: string;
}

// ── Options ──────────────────────────────────────────────────────────────────

const GENDER_OPTIONS = ["Male", "Female", "Other"];
const EMPLOYMENT_TYPE_OPTIONS = ["Full-Time", "Part-Time", "Contract"];
const EMPLOYMENT_STATUS_OPTIONS = ["Active", "On Leave", "Suspended", "Inactive"];
const QUALIFICATION_OPTIONS = ["Certificate", "Diploma", "Bachelor's Degree", "Master's Degree", "PhD"];
const RELATIONSHIP_OPTIONS = ["Spouse", "Parent", "Sibling", "Friend", "Other"];
const ROLE_OPTIONS = ["Teacher", "Head of Department", "Administrator"];

const CLASS_OPTIONS = [
  "Senior One", "Senior Two", "Senior Three",
  "Senior Four", "Senior Five", "Senior Six",
];

const SUBJECT_OPTIONS = [
  "Mathematics", "English Language", "Physics", "Chemistry",
  "Biology", "History", "Geography", "Economics",
  "Literature", "Computer Science", "Art", "Music",
  "Physical Education", "Religious Education",
];

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
  placeholder, value, onChange, options, error,
}: {
  placeholder: string; value: string; onChange: (v: string) => void;
  options: string[]; error?: string;
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%", padding: "10px 36px 10px 14px",
          borderRadius: 8, border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
          fontSize: 13.5, color: value ? "#0f172a" : "#94a3b8",
          background: "#fff", outline: "none", appearance: "none" as const,
          boxSizing: "border-box" as const, cursor: "pointer",
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

function MultiSelect({
  selected, onChange, options, placeholder, error,
}: {
  selected: string[]; onChange: (v: string[]) => void; options: string[]; placeholder: string; error?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.stopPropagation(); setOpen(false); }
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => window.removeEventListener("keydown", onKeyDown, true);
  }, [open]);

  const toggle = (opt: string) => {
    if (selected.includes(opt)) onChange(selected.filter((s) => s !== opt));
    else onChange([...selected, opt]);
  };

  const remove = (opt: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(selected.filter((s) => s !== opt));
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        onClick={() => setOpen((p) => !p)}
        style={{
          minHeight: 44, padding: "6px 36px 6px 10px",
          borderRadius: 8, border: `1.5px solid ${error ? "#ef4444" : "#e2e8f0"}`,
          background: "#fff", cursor: "pointer", display: "flex", flexWrap: "wrap" as const, gap: 6, alignItems: "center",
          boxSizing: "border-box" as const,
        }}
      >
        {selected.length === 0 && (
          <span style={{ fontSize: 13.5, color: "#94a3b8" }}>{placeholder}</span>
        )}
        {selected.map((s) => (
          <span key={s} style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "#eff6ff", color: "#3b82f6", fontSize: 12.5,
            fontWeight: 600, padding: "3px 8px", borderRadius: 20,
            border: "1px solid #bfdbfe",
          }}>
            {s}
            <span style={{ display: "flex", cursor: "pointer" }} onClick={(e) => remove(s, e)}>
              <X size={11} />
            </span>
          </span>
        ))}
        <ChevronDown size={15} style={{ position: "absolute", right: 12, top: 14, color: "#94a3b8" }} />
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0,
          background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 8,
          boxShadow: "0 4px 16px rgba(0,0,0,0.08)", zIndex: 50,
          maxHeight: 220, overflowY: "auto",
        }}>
          {options.map((opt) => (
            <div
              key={opt}
              onClick={() => toggle(opt)}
              style={{
                padding: "9px 14px", fontSize: 13.5, cursor: "pointer",
                color: selected.includes(opt) ? "#3b82f6" : "#334155",
                background: selected.includes(opt) ? "#eff6ff" : "transparent",
                fontWeight: selected.includes(opt) ? 600 : 400,
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}
            >
              {opt}
              {selected.includes(opt) && <span style={{ color: "#3b82f6", fontSize: 12 }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

const INITIAL_FORM: FormData = {
  teacherId: "T-2026-000456",
  firstName: "", middleName: "", lastName: "", gender: "", dateOfBirth: "",
  nationality: "", phoneNumber: "", email: "", address: "",
  employmentType: "", dateOfJoining: "", department: "", position: "", employmentStatus: "Active",
  highestQualification: "", institution: "", specialization: "", yearsOfExperience: "", certifications: "",
  subjectsTaught: [], assignedClasses: [], assignedStreams: "", classTeacher: "No",
  emergencyContactName: "", emergencyRelationship: "", emergencyPhone: "", emergencyAddress: "",
  createAccount: false, username: "", accountEmail: "", role: "", password: "",
};

export default function AddTeacher({ embedded = false }: { embedded?: boolean }) {
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [errors, setErrors] = useState<FieldError>({});
  const [showPassword, setShowPassword] = useState(false);

  const set = (field: keyof FormData, value: string | string[] | boolean) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const toggleAccount = () => {
    setForm((prev) => ({
      ...prev,
      createAccount: !prev.createAccount,
      accountEmail: !prev.createAccount && !prev.accountEmail ? prev.email : prev.accountEmail,
    }));
  };

  const validate = (): boolean => {
    const e: FieldError = {};
    if (!form.firstName.trim()) e.firstName = "First name is required";
    if (!form.lastName.trim()) e.lastName = "Last name is required";
    if (!form.gender) e.gender = "Please select a gender";
    if (!form.dateOfBirth) e.dateOfBirth = "Date of birth is required";
    if (!form.phoneNumber.trim()) e.phoneNumber = "Phone number is required";
    if (!form.email.trim()) e.email = "Email address is required";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Enter a valid email address";
    if (!form.address.trim()) e.address = "Physical address is required";

    if (!form.employmentType) e.employmentType = "Please select an employment type";
    if (!form.dateOfJoining) e.dateOfJoining = "Date of joining is required";
    if (!form.department.trim()) e.department = "Department is required";
    if (!form.position.trim()) e.position = "Position/designation is required";

    if (!form.highestQualification) e.highestQualification = "Please select highest qualification";
    if (!form.institution.trim()) e.institution = "Institution is required";

    if (form.subjectsTaught.length === 0) e.subjectsTaught = "Select at least one subject";

    if (!form.emergencyContactName.trim()) e.emergencyContactName = "Contact name is required";
    if (!form.emergencyRelationship) e.emergencyRelationship = "Please select a relationship";
    if (!form.emergencyPhone.trim()) e.emergencyPhone = "Phone number is required";

    if (form.createAccount) {
      if (!form.username.trim()) e.username = "Username is required";
      if (!form.accountEmail.trim()) e.accountEmail = "Login email is required";
      else if (!/\S+@\S+\.\S+/.test(form.accountEmail)) e.accountEmail = "Enter a valid email address";
      if (!form.role) e.role = "Please select a role";
      if (!form.password || form.password.length < 6) e.password = "Min. 6 characters";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      await teacherService.create({
        teacherId: form.teacherId,
        firstName: form.firstName,
        middleName: form.middleName,
        lastName: form.lastName,
        gender: form.gender,
        dateOfBirth: form.dateOfBirth,
        nationality: form.nationality,
        phoneNumber: form.phoneNumber,
        email: form.email,
        address: form.address,
        employmentType: form.employmentType,
        dateOfJoining: form.dateOfJoining,
        department: form.department,
        position: form.position,
        employmentStatus: form.employmentStatus,
        highestQualification: form.highestQualification,
        institution: form.institution,
        specialization: form.specialization,
        yearsOfExperience: form.yearsOfExperience ? Number(form.yearsOfExperience) : undefined,
        certifications: form.certifications,
        subjectsTaught: form.subjectsTaught,
        assignedClasses: form.assignedClasses,
        assignedStreams: form.assignedStreams,
        classTeacher: form.classTeacher === "Yes",
        emergencyContact: {
          name: form.emergencyContactName,
          relationship: form.emergencyRelationship,
          phone: form.emergencyPhone,
          address: form.emergencyAddress,
        },
        account: form.createAccount ? {
          username: form.username,
          email: form.accountEmail,
          role: form.role,
          password: form.password,
        } : null,
      });

      alert("Teacher saved successfully!");
      handleReset();
    } catch (error: any) {
      alert(error.response?.data?.message ?? "Failed to save teacher.");
    }
  };

  const handleReset = () => {
    setForm(INITIAL_FORM);
    setErrors({});
  };

  return (
    <div style={{ minHeight: embedded ? undefined : "100vh", background: embedded ? "transparent" : "#f1f5f9", padding: embedded ? "20px" : "32px 24px", fontFamily: "'Inter', 'Segoe UI', sans-serif", textAlign: "left" as const }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* ── Page Header ───────────────────────────────────────────────── */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28, flexWrap: "wrap" as const, gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: "#0f172a", margin: 0 }}>Add Teacher</h1>
            <p style={{ fontSize: 13.5, color: "#64748b", margin: "6px 0 0" }}>Register a new teacher into the school information system.</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 20, padding: "6px 14px", fontSize: 12.5, color: "#64748b", fontWeight: 500 }}>
            <span style={{ color: "#ef4444", fontWeight: 700 }}>*</span> Required Information
          </div>
        </div>

        {/* ── Form Card ─────────────────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.04)", overflow: "hidden" }}>

          {/* Card header */}
          <div style={{ padding: "20px 28px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" as const, gap: 10 }}>
            <div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: 16, color: "#3b82f6" }}>Teacher Profile Information</p>
              <p style={{ margin: "3px 0 0", fontSize: 12.5, color: "#94a3b8" }}>Fill in all details to generate a teacher profile.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 20, padding: "5px 12px", fontSize: 12, color: "#3b82f6", fontWeight: 600 }}>
              <Info size={13} /> ID Generation Active
            </div>
          </div>

          <div style={{ padding: "28px" }}>

            {/* ── PERSONAL INFORMATION ──────────────────────────────────── */}
            <SectionHeader title="Personal Information" icon={<User size={13} />} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="Teacher ID / Employee Number" />
                <InputField placeholder="Auto-generated" value={form.teacherId} onChange={() => {}} icon={<Hash size={14} />} readOnly />
              </div>
              <div onBlur={() => {}}>
                <Label text="Gender" required />
                <SelectField placeholder="Select gender" value={form.gender} onChange={(v) => set("gender", v)} options={GENDER_OPTIONS} error={errors.gender} />
                {errors.gender && <ErrorMsg msg={errors.gender} />}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="First Name" required />
                <InputField placeholder="Enter first name" value={form.firstName} onChange={(v) => set("firstName", v)} error={errors.firstName} />
                {errors.firstName && <ErrorMsg msg={errors.firstName} />}
              </div>
              <div>
                <Label text="Middle Name" />
                <InputField placeholder="Enter middle name (optional)" value={form.middleName} onChange={(v) => set("middleName", v)} />
              </div>
              <div>
                <Label text="Last Name" required />
                <InputField placeholder="Enter last name" value={form.lastName} onChange={(v) => set("lastName", v)} error={errors.lastName} />
                {errors.lastName && <ErrorMsg msg={errors.lastName} />}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="Date of Birth" required />
                <InputField placeholder="YYYY-MM-DD" value={form.dateOfBirth} onChange={(v) => set("dateOfBirth", v)} icon={<Calendar size={14} />} type="date" error={errors.dateOfBirth} />
                {errors.dateOfBirth && <ErrorMsg msg={errors.dateOfBirth} />}
              </div>
              <div>
                <Label text="Nationality" />
                <InputField placeholder="e.g. Ugandan" value={form.nationality} onChange={(v) => set("nationality", v)} icon={<Globe size={14} />} />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="Phone Number" required />
                <InputField placeholder="+256 700 000000" value={form.phoneNumber} onChange={(v) => set("phoneNumber", v)} icon={<Phone size={14} />} error={errors.phoneNumber} />
                {errors.phoneNumber && <ErrorMsg msg={errors.phoneNumber} />}
              </div>
              <div>
                <Label text="Email Address" required />
                <InputField placeholder="name@school.edu" value={form.email} onChange={(v) => set("email", v)} icon={<Mail size={14} />} error={errors.email} />
                {errors.email && <ErrorMsg msg={errors.email} />}
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <Label text="Physical Address" required />
              <InputField placeholder="Enter home address" value={form.address} onChange={(v) => set("address", v)} icon={<MapPin size={14} />} error={errors.address} />
              {errors.address && <ErrorMsg msg={errors.address} />}
            </div>

            <div style={{ height: 1, background: "#f1f5f9", margin: "28px 0" }} />

            {/* ── EMPLOYMENT INFORMATION ───────────────────────────────── */}
            <SectionHeader title="Employment Information" icon={<Briefcase size={13} />} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="Employment Type" required />
                <SelectField placeholder="Select employment type" value={form.employmentType} onChange={(v) => set("employmentType", v)} options={EMPLOYMENT_TYPE_OPTIONS} error={errors.employmentType} />
                {errors.employmentType && <ErrorMsg msg={errors.employmentType} />}
              </div>
              <div>
                <Label text="Date of Joining" required />
                <InputField placeholder="YYYY-MM-DD" value={form.dateOfJoining} onChange={(v) => set("dateOfJoining", v)} icon={<Calendar size={14} />} type="date" error={errors.dateOfJoining} />
                {errors.dateOfJoining && <ErrorMsg msg={errors.dateOfJoining} />}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="Department" required />
                <InputField placeholder="e.g. Sciences" value={form.department} onChange={(v) => set("department", v)} error={errors.department} />
                {errors.department && <ErrorMsg msg={errors.department} />}
              </div>
              <div>
                <Label text="Position/Designation" required />
                <InputField placeholder="e.g. Senior Teacher" value={form.position} onChange={(v) => set("position", v)} error={errors.position} />
                {errors.position && <ErrorMsg msg={errors.position} />}
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <Label text="Employment Status" required />
              <SelectField placeholder="Select status" value={form.employmentStatus} onChange={(v) => set("employmentStatus", v)} options={EMPLOYMENT_STATUS_OPTIONS} error={errors.employmentStatus} />
              {errors.employmentStatus && <ErrorMsg msg={errors.employmentStatus} />}
            </div>

            <div style={{ height: 1, background: "#f1f5f9", margin: "28px 0" }} />

            {/* ── QUALIFICATION INFORMATION ────────────────────────────── */}
            <SectionHeader title="Qualification Information" icon={<GraduationCap size={13} />} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="Highest Qualification" required />
                <SelectField placeholder="Select qualification" value={form.highestQualification} onChange={(v) => set("highestQualification", v)} options={QUALIFICATION_OPTIONS} error={errors.highestQualification} />
                {errors.highestQualification && <ErrorMsg msg={errors.highestQualification} />}
              </div>
              <div>
                <Label text="Institution" required />
                <InputField placeholder="e.g. Makerere University" value={form.institution} onChange={(v) => set("institution", v)} error={errors.institution} />
                {errors.institution && <ErrorMsg msg={errors.institution} />}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="Specialization" />
                <InputField placeholder="e.g. Mathematics Education" value={form.specialization} onChange={(v) => set("specialization", v)} />
              </div>
              <div>
                <Label text="Years of Experience" />
                <InputField placeholder="e.g. 5" value={form.yearsOfExperience} onChange={(v) => set("yearsOfExperience", v)} type="number" />
              </div>
            </div>

            <div style={{ marginBottom: 8 }}>
              <Label text="Professional Certifications" />
              <InputField placeholder="e.g. TESOL, Special Needs Education (optional)" value={form.certifications} onChange={(v) => set("certifications", v)} />
            </div>

            <div style={{ height: 1, background: "#f1f5f9", margin: "28px 0" }} />

            {/* ── TEACHING ASSIGNMENT ───────────────────────────────────── */}
            <SectionHeader title="Teaching Assignment" icon={<BookOpen size={13} />} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="Subjects Taught" required />
                <MultiSelect selected={form.subjectsTaught} onChange={(v) => set("subjectsTaught", v)} options={SUBJECT_OPTIONS} placeholder="Select subjects..." error={errors.subjectsTaught} />
                {errors.subjectsTaught && <ErrorMsg msg={errors.subjectsTaught} />}
              </div>
              <div>
                <Label text="Assigned Classes" />
                <MultiSelect selected={form.assignedClasses} onChange={(v) => set("assignedClasses", v)} options={CLASS_OPTIONS} placeholder="Select classes..." />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 8 }}>
              <div>
                <Label text="Assigned Streams" />
                <InputField placeholder="e.g. Alpha, Beta (optional)" value={form.assignedStreams} onChange={(v) => set("assignedStreams", v)} />
              </div>
              <div>
                <Label text="Class Teacher" required />
                <div style={{ display: "flex", gap: 20, alignItems: "center", height: 42 }}>
                  {["Yes", "No"].map((opt) => (
                    <label key={opt} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13.5, color: "#0f172a" }}>
                      <input type="radio" name="classTeacher" checked={form.classTeacher === opt} onChange={() => set("classTeacher", opt)} style={{ accentColor: "#3b82f6", cursor: "pointer" }} />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ height: 1, background: "#f1f5f9", margin: "28px 0" }} />

            {/* ── EMERGENCY CONTACT ─────────────────────────────────────── */}
            <SectionHeader title="Emergency Contact" icon={<ShieldAlert size={13} />} />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
              <div>
                <Label text="Contact Name" required />
                <InputField placeholder="Enter full name" value={form.emergencyContactName} onChange={(v) => set("emergencyContactName", v)} icon={<User size={14} />} error={errors.emergencyContactName} />
                {errors.emergencyContactName && <ErrorMsg msg={errors.emergencyContactName} />}
              </div>
              <div>
                <Label text="Relationship" required />
                <SelectField placeholder="Select relationship" value={form.emergencyRelationship} onChange={(v) => set("emergencyRelationship", v)} options={RELATIONSHIP_OPTIONS} error={errors.emergencyRelationship} />
                {errors.emergencyRelationship && <ErrorMsg msg={errors.emergencyRelationship} />}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 8 }}>
              <div>
                <Label text="Phone Number" required />
                <InputField placeholder="+256 700 000000" value={form.emergencyPhone} onChange={(v) => set("emergencyPhone", v)} icon={<Phone size={14} />} error={errors.emergencyPhone} />
                {errors.emergencyPhone && <ErrorMsg msg={errors.emergencyPhone} />}
              </div>
              <div>
                <Label text="Address" />
                <InputField placeholder="Enter address (optional)" value={form.emergencyAddress} onChange={(v) => set("emergencyAddress", v)} icon={<MapPin size={14} />} />
              </div>
            </div>

            <div style={{ height: 1, background: "#f1f5f9", margin: "28px 0" }} />

            {/* ── ACCOUNT ───────────────────────────────────────────────── */}
            <SectionHeader title="Account" icon={<KeyRound size={13} />} />
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", marginBottom: form.createAccount ? 20 : 0 }}>
              <input type="checkbox" checked={form.createAccount} onChange={toggleAccount} style={{ width: 16, height: 16, accentColor: "#3b82f6", cursor: "pointer" }} />
              <span style={{ fontSize: 13.5, color: "#334155" }}>This teacher will log into the system — create a login account</span>
            </label>

            {form.createAccount && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
                  <div>
                    <Label text="Username" required />
                    <InputField placeholder="e.g. j.smith" value={form.username} onChange={(v) => set("username", v)} icon={<User size={14} />} error={errors.username} />
                    {errors.username && <ErrorMsg msg={errors.username} />}
                  </div>
                  <div>
                    <Label text="Email" required />
                    <InputField placeholder="name@school.edu" value={form.accountEmail} onChange={(v) => set("accountEmail", v)} icon={<Mail size={14} />} error={errors.accountEmail} />
                    {errors.accountEmail && <ErrorMsg msg={errors.accountEmail} />}
                  </div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 8 }}>
                  <div>
                    <Label text="Role" required />
                    <SelectField placeholder="Select role" value={form.role} onChange={(v) => set("role", v)} options={ROLE_OPTIONS} error={errors.role} />
                    {errors.role && <ErrorMsg msg={errors.role} />}
                  </div>
                  <div>
                    <Label text="Password" required />
                    <div style={{ position: "relative" }}>
                      <InputField
                        placeholder="Minimum 6 characters"
                        value={form.password}
                        onChange={(v) => set("password", v)}
                        icon={<KeyRound size={14} />}
                        type={showPassword ? "text" : "password"}
                        error={errors.password}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#94a3b8", fontSize: 11.5, fontWeight: 600 }}
                      >
                        {showPassword ? "Hide" : "Show"}
                      </button>
                    </div>
                    {errors.password && <ErrorMsg msg={errors.password} />}
                  </div>
                </div>
              </>
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
                Save Teacher Profile
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
