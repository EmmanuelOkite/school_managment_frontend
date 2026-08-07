import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, GraduationCap, Users, UserCheck, School,
  CalendarCheck, FileText, BookOpen, DollarSign, Library,
  Bus, Heart, Megaphone, BarChart2, UserCog, Settings,
  Shield, LogOut, ChevronDown, ChevronUp, Bell, Search,
} from "lucide-react";

interface SidebarItem {
  icon: React.ReactNode;
  label: string;
  key: string;
  badge?: string;
  children: string[];
}

interface StatCard {
  label: string;
  value: string;
  change: string;
  up: boolean;
  icon: string;
  color: string;
}

interface Activity {
  user: string;
  action: string;
  time: string;
  tag: string;
}

interface ExamRow {
  subject: string;
  class: string;
  date: string;
  status: string;
  score: string;
  scoreColor: string | null;
}

interface TimetableRow {
  time: string;
  subject: string;
  room: string;
  teacher: string;
}

interface QuickAction {
  icon: string;
  label: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  {
    icon: <LayoutDashboard size={16} />, label: "Dashboard", key: "dashboard",
    children: ["Announcements"],
  },
  {
    icon: <GraduationCap size={16} />, label: "Students", key: "students",
    children: ["Add Student", "Manage Students", "Student Attendance",],
  },
  {
    icon: <UserCheck size={16} />, label: "Teachers", key: "teachers",
    children: ["Add Teacher", "Manage Teachers", "Teacher Attendance", "Teacher Timetable"],
  },
  {
    icon: <Users size={16} />, label: "Parents", key: "parents",
    children: ["Add Parent", "Manage Parents"],
  },
  {
    icon: <School size={16} />, label: "Academic Management", key: "academics",
    children: ["Classes", "Streams/Sections", "Subjects", "Academic Years", "Terms/Semesters"],
  },
  {
    icon: <CalendarCheck size={16} />, label: "Attendance", key: "attendance",
    children: ["Student Attendance", "Teacher Attendance", "Attendance Reports"],
  },
  {
    icon: <FileText size={16} />, label: "Examinations", key: "examinations",
    children: ["Create Exams", "Enter Marks", "Grade Management", "Report Cards", "Results Analysis"],
  },
  {
    icon: <BookOpen size={16} />, label: "Timetable", key: "timetable",
    children: ["Class Timetable", "Teacher Timetable", "Exam Timetable"],
  },
  {
    icon: <DollarSign size={16} />, label: "Finance", key: "finance",
    children: ["Fee Structures", "Fee Collection", "Student Balances", "Expenses", "Financial Reports"],
  },
  {
    icon: <Library size={16} />, label: "Library", key: "library",
    children: ["Books", "Book Categories", "Borrowed Books"],
  },
  {
    icon: <Bus size={16} />, label: "Transport", key: "transport",
    children: ["Vehicles", "Routes", "Driver Management"],
  },
  {
    icon: <Heart size={16} />, label: "Health", key: "health",
    children: ["Medical Records", "Sick Bay Visits"],
  },
  {
    icon: <Megaphone size={16} />, label: "Communication", key: "communication",
    children: ["Announcements", "SMS Notifications", "Email Notifications", "Notice Board"],
  },
  {
    icon: <BarChart2 size={16} />, label: "Reports", key: "reports",
    children: ["Student Reports", "Academic Reports", "Attendance Reports", "Financial Reports"],
  },
  {
    icon: <UserCog size={16} />, label: "User Management", key: "users",
    children: ["Users", "Roles & Permissions", "Account Creation", "Login Activity"],
  },
  {
    icon: <Settings size={16} />, label: "Settings", key: "settings",
    children: ["School Information", "Academic Settings", "System Preferences", "Backup & Restore"],
  },
  {
    icon: <Shield size={16} />, label: "Security", key: "security",
    children: ["Audit Logs", "Access Logs"],
  },
];

// Maps sidebar child labels to their routes
const ROUTES: Record<string, string> = {
  "Add Student": "/students/add",
  "Manage Students": "/students",
  "Student Attendance": "/attendance/students",
  "Announcements": "/communication/announcements/create",
  "Add Teacher": "/teachers/add",
  "Manage Teachers": "/teachers",
  "Add Parent": "/parents/add",
  "Manage Parents": "/parents",
  "Create Exams": "/exams/create",
  "Fee Structures": "/finance/fee-structures",
  "Fee Collection": "/finance/fee-collection",
  "Student Balances": "/finance/student-balances",
  "Expenses": "/finance/expenses",
  "Financial Reports": "/finance/reports",
  "Class Timetable": "/timetable/class",
  "Teacher Timetable": "/timetable/teacher",
  "Exam Timetable": "/timetable/exam",
};

const statCards: StatCard[] = [
  { label: "Total Students", value: "1,248", change: "+12.5% vs last month", up: true, icon: "👨‍🎓", color: "#3b82f6" },
  { label: "Staff Members", value: "94", change: "+3.1% vs last month", up: true, icon: "👨‍🏫", color: "#10b981" },
  { label: "Daily Attendance", value: "91.4%", change: "-0.4% vs last month", up: false, icon: "📅", color: "#f59e0b" },
  { label: "Pending Fees", value: "$12,450", change: "-8.2% vs last month", up: false, icon: "💰", color: "#ef4444" },
];

const recentActivities: Activity[] = [
  { user: "Sarah Jenkins", action: "Added new student: Michael Chen", time: "10 mins ago", tag: "system" },
  { user: "System", action: "Automated backup completed", time: "45 mins ago", tag: "info" },
  { user: "John Doe", action: "Updated Fee Structure for 2024", time: "2 hours ago", tag: "finance" },
  { user: "Emily Rose", action: "Published Grade 11-B Results", time: "5 hours ago", tag: "academic" },
  { user: "Admin", action: "Authorized transport maintenance", time: "Yesterday", tag: "transport" },
];

const examsData: ExamRow[] = [
  { subject: "Mathematics", class: "Grade 10-A", date: "Oct 20, 2023", status: "Graded", score: "84%", scoreColor: "#3b82f6" },
  { subject: "Physics", class: "Grade 11-B", date: "Oct 21, 2023", status: "In Progress", score: "—", scoreColor: null },
  { subject: "English", class: "Grade 9-C", date: "Oct 18, 2023", status: "Graded", score: "78%", scoreColor: "#3b82f6" },
  { subject: "History", class: "Grade 12-A", date: "Oct 22, 2023", status: "Scheduled", score: "—", scoreColor: null },
  { subject: "Biology", class: "Grade 10-B", date: "Oct 15, 2023", status: "Graded", score: "91%", scoreColor: "#10b981" },
];

const timetableToday: TimetableRow[] = [
  { time: "08:00–09:30", subject: "Calculus Advanced", room: "Hall A-12", teacher: "Dr. Smith" },
  { time: "09:45–11:15", subject: "Molecular Biology", room: "Lab 04", teacher: "Prof. Greene" },
  { time: "11:30–13:00", subject: "Art & Design", room: "Studio 2", teacher: "Ms. Vance" },
];

const quickActions: QuickAction[] = [
  { icon: "➕", label: "Enroll Student" },
  { icon: "✅", label: "Mark Attendance" },
  { icon: "📅", label: "Exam Schedule" },
  { icon: "💵", label: "Fee Payment" },
  { icon: "👥", label: "Staff Meeting" },
  { icon: "📢", label: "Announcements" },
];

function AttendanceChart() {
  const studentData: number[] = [1100, 1080, 1150, 1050, 900, 600, 200];
  const teacherData: number[] = [88, 85, 90, 82, 78, 60, 40];
  const days: string[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const w = 400, h = 140, pad = 30;
  const maxVal = 1200;
  const toX = (i: number): number => pad + (i / (days.length - 1)) * (w - pad * 2);
  const toY = (v: number, max: number): number => h - pad - ((v / max) * (h - pad * 2));
  const studentPath = studentData.map((v: number, i: number) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v, maxVal)}`).join(" ");
  const teacherPath = teacherData.map((v: number, i: number) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v, 100)}`).join(" ");
  const areaPath = studentData.map((v: number, i: number) => `${i === 0 ? "M" : "L"}${toX(i)},${toY(v, maxVal)}`).join(" ") +
    ` L${toX(6)},${h - pad} L${toX(0)},${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height: "100%" }}>
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" />
      <path d={studentPath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d={teacherPath} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {days.map((d: string, i: number) => (
        <text key={d} x={toX(i)} y={h - 4} textAnchor="middle" fontSize="10" fill="#94a3b8">{d}</text>
      ))}
      {[0, 300, 600, 900, 1200].map((v: number) => (
        <text key={v} x={pad - 4} y={toY(v, maxVal) + 4} textAnchor="end" fontSize="9" fill="#94a3b8">{v}</text>
      ))}
    </svg>
  );
}

function DonutChart() {
  const collected = 85000, pending = 12450, overdue = 3200;
  const total = collected + pending + overdue;
  const r = 45, cx = 60, cy = 60, stroke = 14;
  const circ = 2 * Math.PI * r;
  const collectedPct = (collected / total) * circ;
  const pendingPct = (pending / total) * circ;
  const overduePct = (overdue / total) * circ;
  return (
    <svg viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#3b82f6" strokeWidth={stroke}
        strokeDasharray={`${collectedPct} ${circ}`} strokeDashoffset={circ * 0.25} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#f59e0b" strokeWidth={stroke}
        strokeDasharray={`${pendingPct} ${circ}`} strokeDashoffset={circ * 0.25 - collectedPct} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#ef4444" strokeWidth={stroke}
        strokeDasharray={`${overduePct} ${circ}`} strokeDashoffset={circ * 0.25 - collectedPct - pendingPct} strokeLinecap="round" />
    </svg>
  );
}

const tagColors: Record<string, { bg: string; color: string }> = {
  system: { bg: "#eff6ff", color: "#3b82f6" },
  info: { bg: "#f0fdf4", color: "#10b981" },
  finance: { bg: "#fffbeb", color: "#f59e0b" },
  academic: { bg: "#faf5ff", color: "#8b5cf6" },
  transport: { bg: "#fff7ed", color: "#f97316" },
};

export default function Dashboard() {
  const [openKeys, setOpenKeys] = useState<Record<string, boolean>>({ dashboard: true });
  const [activeItem, setActiveItem] = useState<string>("Overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggle = (key: string) => setOpenKeys((prev: Record<string, boolean>) => ({ ...prev, [key]: !prev[key] }));

  const handleChildClick = (child: string) => {
    setActiveItem(child);
    if (ROUTES[child]) {
      navigate(ROUTES[child], { state: { background: location } });
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "'Inter', 'Segoe UI', sans-serif", background: "#f8fafc", color: "#0f172a", overflow: "hidden" }}>

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside style={{
        width: sidebarCollapsed ? 64 : 240,
        minWidth: sidebarCollapsed ? 64 : 240,
        background: "#0f172a",
        display: "flex", flexDirection: "column",
        transition: "width 0.2s, min-width 0.2s",
        overflow: "hidden",
        zIndex: 10,
      }}>
        {/* Logo */}
        <div style={{ padding: "18px 16px 12px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <School size={18} color="#fff" />
          </div>
          {!sidebarCollapsed && <span style={{ fontWeight: 700, fontSize: 14, color: "#f1f5f9", whiteSpace: "nowrap" }}>School Admin</span>}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {SIDEBAR_ITEMS.map((item: SidebarItem) => (
            <div key={item.key}>
              <button onClick={() => toggle(item.key)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 16px", background: "none", border: "none", cursor: "pointer",
                  color: openKeys[item.key] ? "#60a5fa" : "#94a3b8",
                  fontSize: 13, fontWeight: 500, textAlign: "left",
                  transition: "color 0.15s",
                  borderRadius: 0,
                }}>
                <span style={{ flexShrink: 0, width: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.icon}
                </span>
                {!sidebarCollapsed && (
                  <>
                    <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.label}</span>
                    {item.badge && (
                      <span style={{ background: item.badge === "New" ? "#10b981" : "#3b82f6", color: "#fff", fontSize: 10, fontWeight: 700, padding: "1px 6px", borderRadius: 10 }}>
                        {item.badge}
                      </span>
                    )}
                    <span style={{ display: "flex", alignItems: "center", color: "#475569" }}>
                      {openKeys[item.key] ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </span>
                  </>
                )}
              </button>
              {!sidebarCollapsed && openKeys[item.key] && (
                <div style={{ background: "#080f1a" }}>
                  {item.children.map((child: string) => (
                    <button
                      key={child}
                      onClick={() => handleChildClick(child)}
                      style={{
                        width: "100%", display: "block", textAlign: "left",
                        padding: "7px 16px 7px 46px", background: "none", border: "none",
                        cursor: "pointer", fontSize: 12.5,
                        color: activeItem === child ? "#60a5fa" : "#64748b",
                        fontWeight: activeItem === child ? 600 : 400,
                        borderLeft: activeItem === child ? "2px solid #3b82f6" : "2px solid transparent",
                        transition: "color 0.15s",
                      }}>
                      {child}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Logout */}
          <button
  onClick={() => navigate("/login")}
  style={{
    width: "100%", display: "flex", alignItems: "center", gap: 10,
    padding: "9px 16px", background: "none", border: "none", cursor: "pointer",
    color: "#ef4444", fontSize: 13, fontWeight: 500, marginTop: 4,
  }}>
  <span style={{ flexShrink: 0, width: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
    <LogOut size={16} />
  </span>
  {!sidebarCollapsed && <span>Logout</span>}
</button>
        </nav>

        {/* Collapse toggle */}
        <button onClick={() => setSidebarCollapsed((p: boolean) => !p)}
          style={{ padding: "12px 16px", background: "none", border: "none", cursor: "pointer", color: "#475569", display: "flex", alignItems: "center", justifyContent: sidebarCollapsed ? "center" : "flex-end" }}>
          {sidebarCollapsed
            ? <ChevronDown size={16} style={{ transform: "rotate(-90deg)" }} />
            : <ChevronDown size={16} style={{ transform: "rotate(90deg)" }} />}
        </button>
      </aside>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Topbar */}
        <header style={{
          height: 56, background: "#fff", borderBottom: "1px solid #e2e8f0",
          display: "flex", alignItems: "center", padding: "0 24px", gap: 16, flexShrink: 0,
        }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: "#0f172a" }}>Dashboard Overview</span>
          <div style={{ flex: 1, maxWidth: 400, marginLeft: 12, position: "relative" }}>
            <Search size={14} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
            <input placeholder="Search students, teachers, classes..." style={{
              width: "100%", padding: "7px 14px 7px 32px", borderRadius: 8,
              border: "1px solid #e2e8f0", fontSize: 13, color: "#334155", background: "#f8fafc", outline: "none",
            }} />
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ position: "relative" }}>
              <Bell size={18} color="#64748b" />
              <div style={{ position: "absolute", top: -3, right: -3, width: 7, height: 7, borderRadius: "50%", background: "#ef4444" }} />
            </div>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 13 }}>A</div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>

          {/* Welcome row */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0, color: "#0f172a" }}>Welcome back, Admin</h1>
              <p style={{ fontSize: 13, color: "#64748b", margin: "4px 0 0" }}>Here is a detailed look at what's happening in school as of today.</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, color: "#64748b", background: "#f1f5f9", padding: "6px 12px", borderRadius: 8 }}>📅 Oct 23, 2023 – Oct 29, 2023</span>
              <button style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", border: "none", padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                ↗ Export Overview
              </button>
            </div>
          </div>

          {/* Stat cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
            {statCards.map((c: StatCard) => (
              <div key={c.label} style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e2e8f0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontWeight: 500 }}>{c.label}</p>
                    <p style={{ margin: "6px 0 0", fontSize: 24, fontWeight: 700, color: "#0f172a" }}>{c.value}</p>
                    <p style={{ margin: "6px 0 0", fontSize: 11.5, color: c.up ? "#10b981" : "#ef4444", fontWeight: 500 }}>{c.change}</p>
                  </div>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: c.color + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>{c.icon}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Actions */}
          <div style={{ background: "#fff", borderRadius: 12, padding: "16px 20px", marginBottom: 24, border: "1px solid #e2e8f0" }}>
            <p style={{ margin: "0 0 12px", fontSize: 12, fontWeight: 600, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase" }}>Quick Actions</p>
            <div style={{ display: "flex", gap: 12 }}>
              {quickActions.map((a: QuickAction) => (
                <button
                  key={a.label}
                  onClick={() => { if (a.label === "Enroll Student") navigate("/students/add", { state: { background: location } }); }}
                  style={{
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                    padding: "12px 20px", borderRadius: 10, border: "1px solid #e2e8f0",
                    background: "#f8fafc", cursor: "pointer", fontSize: 12, color: "#334155", fontWeight: 500,
                  }}>
                  <span style={{ fontSize: 20 }}>{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Attendance + Fee Collection */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: "20px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "#0f172a" }}>Attendance Summary</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>Daily presence tracking for the current week</p>
                </div>
                <button style={{ background: "none", border: "none", color: "#3b82f6", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>View Reports →</button>
              </div>
              <div style={{ height: 160, marginTop: 12 }}><AttendanceChart /></div>
              <div style={{ display: "flex", gap: 20, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 3, background: "#3b82f6", display: "inline-block", borderRadius: 2 }} /> Students</span>
                <span style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 3, background: "#10b981", display: "inline-block", borderRadius: 2 }} /> Teachers</span>
              </div>
            </div>

            <div style={{ background: "#fff", borderRadius: 12, padding: "20px", border: "1px solid #e2e8f0" }}>
              <p style={{ margin: "0 0 2px", fontWeight: 600, fontSize: 15, color: "#0f172a" }}>Fee Collection</p>
              <p style={{ margin: "0 0 16px", fontSize: 12, color: "#94a3b8" }}>Status for Term 3 (Oct – Dec)</p>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}><DonutChart /></div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[{ color: "#3b82f6", label: "Collected", val: "$85,000" }, { color: "#f59e0b", label: "Pending", val: "$12,450" }, { color: "#ef4444", label: "Overdue", val: "$3,200" }].map((r) => (
                  <div key={r.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#475569" }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", background: r.color, display: "inline-block" }} />{r.label}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Exams + Timetable */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: "20px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "#0f172a" }}>Examinations Overview</p>
                <button
                  onClick={() => navigate("/exams/create")}
                  style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, color: "#334155", cursor: "pointer" }}>
                  Manage Exams
                </button>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                    {["Subject", "Class", "Date", "Status", "Avg Score"].map((h: string) => (
                      <th key={h} style={{ padding: "6px 8px", textAlign: "left", color: "#94a3b8", fontWeight: 600, fontSize: 11.5 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {examsData.map((e: ExamRow) => (
                    <tr key={e.subject} style={{ borderBottom: "1px solid #f8fafc" }}>
                      <td style={{ padding: "10px 8px", fontWeight: 500, color: "#0f172a" }}>{e.subject}</td>
                      <td style={{ padding: "10px 8px", color: "#475569" }}>{e.class}</td>
                      <td style={{ padding: "10px 8px", color: "#475569" }}>{e.date}</td>
                      <td style={{ padding: "10px 8px" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: 20, fontSize: 11.5, fontWeight: 600,
                          background: e.status === "Graded" ? "#f0fdf4" : e.status === "In Progress" ? "#fffbeb" : "#eff6ff",
                          color: e.status === "Graded" ? "#10b981" : e.status === "In Progress" ? "#f59e0b" : "#3b82f6",
                        }}>{e.status}</span>
                      </td>
                      <td style={{ padding: "10px 8px", fontWeight: 700, color: e.scoreColor ?? "#94a3b8" }}>{e.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ background: "#fff", borderRadius: 12, padding: "20px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "#0f172a" }}>Today's Timetable</p>
                <CalendarCheck size={16} color="#94a3b8" />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {timetableToday.map((t: TimetableRow) => (
                  <div key={t.subject} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                    <div style={{ minWidth: 70, fontSize: 11.5, color: "#94a3b8", fontWeight: 500, paddingTop: 2 }}>{t.time}</div>
                    <div style={{ flex: 1, background: "#f8fafc", borderRadius: 8, padding: "10px 12px", borderLeft: "3px solid #3b82f6" }}>
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 13, color: "#0f172a" }}>{t.subject}</p>
                      <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "#94a3b8" }}>{t.room} • {t.teacher}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate("/timetable/class")}
                style={{ width: "100%", marginTop: 16, background: "none", border: "none", color: "#3b82f6", fontSize: 13, fontWeight: 600, cursor: "pointer", textAlign: "left" }}>
                View Full Timetable →
              </button>
            </div>
          </div>

          {/* Academic Growth + System Update */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginBottom: 24 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: "20px", border: "1px solid #e2e8f0" }}>
              <p style={{ margin: "0 0 16px", fontWeight: 600, fontSize: 15, color: "#0f172a", display: "flex", alignItems: "center", gap: 8 }}>
                <BarChart2 size={16} color="#3b82f6" /> Academic Growth Index
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  {[{ label: "Standardized Test Avg", pct: 78, color: "#3b82f6" }, { label: "Term Completion Rate", pct: 92, color: "#10b981" }].map((m) => (
                    <div key={m.label} style={{ marginBottom: 16 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, color: "#475569" }}>{m.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.pct}%</span>
                      </div>
                      <div style={{ height: 6, background: "#f1f5f9", borderRadius: 4 }}>
                        <div style={{ width: `${m.pct}%`, height: "100%", background: m.color, borderRadius: 4 }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div>
                  <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, margin: 0 }}>
                    Overall academic performance is trending upwards by 4.2% compared to last semester. Grade 10-A shows exceptional progress in Mathematics.
                  </p>
                  <button style={{ marginTop: 10, background: "none", border: "none", color: "#3b82f6", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0 }}>View performance insights →</button>
                </div>
              </div>
            </div>

            <div style={{ background: "linear-gradient(135deg,#eff6ff,#eef2ff)", borderRadius: 12, padding: "24px 20px", border: "1px solid #dbeafe", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", justifyContent: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg,#3b82f6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                <Settings size={22} color="#fff" />
              </div>
              <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 15, color: "#1e3a8a" }}>System Update</p>
              <p style={{ margin: "0 0 16px", fontSize: 12.5, color: "#3b82f6", lineHeight: 1.6 }}>The Library Management module has been updated with automatic barcode scanning.</p>
              <button style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", color: "#fff", border: "none", padding: "9px 20px", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Learn What's New</button>
            </div>
          </div>

          {/* Recent Activity + Library + Transport */}
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16 }}>
            <div style={{ background: "#fff", borderRadius: 12, padding: "20px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 15, color: "#0f172a" }}>Recent Administrative Activity</p>
                  <p style={{ margin: "2px 0 0", fontSize: 12, color: "#94a3b8" }}>Live feed of system and staff actions</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", padding: "6px 12px", borderRadius: 7, fontSize: 12, cursor: "pointer", color: "#334155" }}>Download Log</button>
                  <button style={{ background: "none", border: "none", fontSize: 18, cursor: "pointer", color: "#94a3b8" }}>⋯</button>
                </div>
              </div>
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
                {recentActivities.map((a: Activity, i: number) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: 14, borderBottom: i < recentActivities.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: tagColors[a.tag]?.color ?? "#94a3b8", marginTop: 5, flexShrink: 0 }} />
                      <div>
                        <p style={{ margin: 0, fontSize: 13, color: "#0f172a" }}>
                          <span style={{ fontWeight: 600, color: tagColors[a.tag]?.color ?? "#334155" }}>{a.user}</span>{" "}{a.action}
                        </p>
                        <p style={{ margin: "3px 0 0", fontSize: 11.5, color: "#94a3b8" }}>{a.time}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 10, background: tagColors[a.tag]?.bg ?? "#f1f5f9", color: tagColors[a.tag]?.color ?? "#94a3b8", flexShrink: 0 }}>{a.tag}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e2e8f0", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Library size={15} color="#3b82f6" />
                  <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#0f172a" }}>Library Highlights</p>
                </div>
                <p style={{ margin: "0 0 12px", fontSize: 12, color: "#94a3b8" }}>42 Books issued today • 8 Overdue returns</p>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                  {["🧑", "👩", "👦", "👩‍🦱", "🧑‍🦰"].map((e: string, i: number) => (
                    <div key={i} style={{ width: 30, height: 30, borderRadius: "50%", background: "#e0e7ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, marginLeft: i > 0 ? -8 : 0, border: "2px solid #fff" }}>{e}</div>
                  ))}
                  <span style={{ fontSize: 12, color: "#64748b", marginLeft: 4 }}>+38</span>
                </div>
                <button style={{ background: "none", border: "1px solid #e2e8f0", padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, color: "#334155", cursor: "pointer" }}>Manage Circulation ↗</button>
              </div>
              <div style={{ background: "#fff", borderRadius: 12, padding: "18px 20px", border: "1px solid #e2e8f0", flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <Bus size={15} color="#10b981" />
                      <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: "#0f172a" }}>Transport Status</p>
                    </div>
                    <p style={{ margin: "0 0 12px", fontSize: 12, color: "#94a3b8" }}>12/12 Buses active • No delays reported</p>
                  </div>
                  <span style={{ background: "#f0fdf4", color: "#10b981", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20 }}>ALL CLEAR</span>
                </div>
                <button style={{ background: "none", border: "1px solid #e2e8f0", padding: "7px 14px", borderRadius: 7, fontSize: 12, fontWeight: 600, color: "#334155", cursor: "pointer" }}>Track Fleet Live ↗</button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 32, textAlign: "center", fontSize: 12, color: "#94a3b8", paddingBottom: 8 }}>
            © 2026 School Admin. All rights reserved. | SMC
          </div>
        </main>
      </div>
    </div>
  );
}