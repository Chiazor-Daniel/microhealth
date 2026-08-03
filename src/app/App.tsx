import { useState, useRef } from "react";
import {
  BrowserRouter, Routes, Route, NavLink, useNavigate,
  Outlet, Navigate, useLocation,
} from "react-router";
import {
  LayoutDashboard, Users, Calendar, FileText, MessageSquare,
  Settings, Bell, ChevronDown, TrendingUp, TrendingDown,
  Activity, Heart, AlertCircle, Clock, Search, MoreHorizontal,
  LogOut, User, Shield, Pill, Stethoscope, Home, FlaskConical,
  Package, DollarSign, BarChart3, ArrowRight, ArrowLeft,
  CheckCircle, XCircle, RefreshCw, Download, Plus, Filter,
  GitBranch, Syringe, Thermometer, Zap, Eye, Pencil, Trash2,
  ChevronRight, Phone, Mail, MapPin, Star, AlertTriangle,
  ClipboardList, Building2, UserCheck, TrendingUp as TU,
  Lock, KeyRound, SmartphoneNfc, ChevronUp, Info
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  PieChart, Pie, Cell,
} from "recharts";

// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA
// ─────────────────────────────────────────────────────────────────────────────

const PATIENTS = [
  { id: "PAT-001", name: "Eleanor Vance", age: 52, gender: "F", blood: "A+", phone: "+234 801 234 5678", email: "e.vance@mail.com", status: "active", lastVisit: "28 Jun 2026", nextAppt: "5 Jul 2026", diagnosis: "Hypertension", doctor: "Dr. M. Okonkwo", ward: "Cardio-2" },
  { id: "PAT-002", name: "James Whitfield", age: 34, gender: "M", blood: "O-", phone: "+234 802 987 6543", email: "j.whitfield@mail.com", status: "critical", lastVisit: "30 Jun 2026", nextAppt: "3 Jul 2026", diagnosis: "Subdural Haematoma", doctor: "Dr. S. Patel", ward: "Neuro-1" },
  { id: "PAT-003", name: "Yuki Tanaka", age: 28, gender: "F", blood: "B+", phone: "+234 803 456 7890", email: "y.tanaka@mail.com", status: "active", lastVisit: "1 Jul 2026", nextAppt: "10 Jul 2026", diagnosis: "Upper Resp. Infection", doctor: "Dr. L. Ferreira", ward: "General-3" },
  { id: "PAT-004", name: "Marcus Bell", age: 67, gender: "M", blood: "AB+", phone: "+234 804 321 0987", email: "m.bell@mail.com", status: "critical", lastVisit: "3 Jul 2026", nextAppt: "—", diagnosis: "Acute MI", doctor: "Dr. A. Kowalski", ward: "ICU-3" },
  { id: "PAT-005", name: "Sofia Mendez", age: 41, gender: "F", blood: "A-", phone: "+234 805 654 3210", email: "s.mendez@mail.com", status: "active", lastVisit: "2 Jul 2026", nextAppt: "7 Jul 2026", diagnosis: "Arrhythmia", doctor: "Dr. M. Okonkwo", ward: "Cardio-1" },
  { id: "PAT-006", name: "David Chen", age: 59, gender: "M", blood: "O+", phone: "+234 806 789 0123", email: "d.chen@mail.com", status: "discharged", lastVisit: "29 Jun 2026", nextAppt: "15 Jul 2026", diagnosis: "Colorectal Carcinoma", doctor: "Dr. R. Nair", ward: "—" },
  { id: "PAT-007", name: "Amira Hassan", age: 31, gender: "F", blood: "B-", phone: "+234 807 012 3456", email: "a.hassan@mail.com", status: "active", lastVisit: "3 Jul 2026", nextAppt: "8 Jul 2026", diagnosis: "Gestational Diabetes", doctor: "Dr. L. Ferreira", ward: "OB-2" },
  { id: "PAT-008", name: "Peter Obi", age: 73, gender: "M", blood: "A+", phone: "+234 808 345 6789", email: "p.obi@mail.com", status: "observation", lastVisit: "3 Jul 2026", nextAppt: "—", diagnosis: "COPD Exacerbation", doctor: "Dr. S. Patel", ward: "Resp-1" },
];

const APPOINTMENTS = [
  { id: "APT-0391", patient: "Eleanor Vance", age: 52, doctor: "Dr. M. Okonkwo", dept: "Cardiology", time: "09:00 AM", date: "3 Jul 2026", status: "confirmed" },
  { id: "APT-0392", patient: "James Whitfield", age: 34, doctor: "Dr. S. Patel", dept: "Neurology", time: "09:30 AM", date: "3 Jul 2026", status: "in-progress" },
  { id: "APT-0393", patient: "Yuki Tanaka", age: 28, doctor: "Dr. L. Ferreira", dept: "General", time: "10:00 AM", date: "3 Jul 2026", status: "confirmed" },
  { id: "APT-0394", patient: "Marcus Bell", age: 67, doctor: "Dr. A. Kowalski", dept: "Orthopedics", time: "10:30 AM", date: "3 Jul 2026", status: "critical" },
  { id: "APT-0395", patient: "Sofia Mendez", age: 41, doctor: "Dr. M. Okonkwo", dept: "Cardiology", time: "11:00 AM", date: "3 Jul 2026", status: "pending" },
  { id: "APT-0396", patient: "David Chen", age: 59, doctor: "Dr. R. Nair", dept: "Oncology", time: "11:30 AM", date: "3 Jul 2026", status: "confirmed" },
  { id: "APT-0397", patient: "Amira Hassan", age: 31, doctor: "Dr. L. Ferreira", dept: "Obstetrics", time: "02:00 PM", date: "3 Jul 2026", status: "confirmed" },
  { id: "APT-0398", patient: "Peter Obi", age: 73, doctor: "Dr. S. Patel", dept: "Pulmonology", time: "02:30 PM", date: "3 Jul 2026", status: "pending" },
];

const PATIENT_TREND = [
  { month: "Jan", admitted: 142, discharged: 128 },
  { month: "Feb", admitted: 158, discharged: 141 },
  { month: "Mar", admitted: 171, discharged: 163 },
  { month: "Apr", admitted: 165, discharged: 170 },
  { month: "May", admitted: 183, discharged: 176 },
  { month: "Jun", admitted: 197, discharged: 188 },
  { month: "Jul", admitted: 210, discharged: 201 },
];

const REVENUE_TREND = [
  { day: "Mon", revenue: 142000, transactions: 38 },
  { day: "Tue", revenue: 168000, transactions: 44 },
  { day: "Wed", revenue: 155000, transactions: 41 },
  { day: "Thu", revenue: 183000, transactions: 52 },
  { day: "Fri", revenue: 197000, transactions: 58 },
  { day: "Sat", revenue: 121000, transactions: 31 },
  { day: "Sun", revenue: 98000, transactions: 24 },
];

const WARD_OCCUPANCY = [
  { ward: "Cardio", capacity: 40, occupied: 34 },
  { ward: "Neuro", capacity: 30, occupied: 27 },
  { ward: "Ortho", capacity: 50, occupied: 38 },
  { ward: "Pediatric", capacity: 35, occupied: 29 },
  { ward: "ICU", capacity: 20, occupied: 18 },
];

const CRITICAL_ALERTS = [
  { patient: "Marcus Bell", ward: "ICU-3", alert: "BP elevated — 178/112 mmHg", time: "4m ago", severity: "high" },
  { patient: "Ruth Engström", ward: "Cardio-2", alert: "Irregular sinus rhythm detected", time: "11m ago", severity: "high" },
  { patient: "Omar Hassan", ward: "Neuro-1", alert: "GCS score dropped to 12", time: "23m ago", severity: "medium" },
];

const STAFF = [
  { id: "STF-001", name: "Dr. M. Okonkwo", role: "Attending Physician", dept: "Cardiology", status: "on-duty", patients: 8, phone: "+234 801 111 2222" },
  { id: "STF-002", name: "Dr. S. Patel", role: "Neurologist", dept: "Neurology", status: "on-duty", patients: 5, phone: "+234 801 222 3333" },
  { id: "STF-003", name: "Dr. L. Ferreira", role: "General Physician", dept: "General Practice", status: "on-duty", patients: 12, phone: "+234 801 333 4444" },
  { id: "STF-004", name: "Dr. A. Kowalski", role: "Orthopaedic Surgeon", dept: "Orthopedics", status: "off-duty", patients: 0, phone: "+234 801 444 5555" },
  { id: "STF-005", name: "Dr. R. Nair", role: "Oncologist", dept: "Oncology", status: "on-duty", patients: 6, phone: "+234 801 555 6666" },
  { id: "STF-006", name: "Nurse A. Ibrahim", role: "Head Nurse", dept: "ICU", status: "on-duty", patients: 18, phone: "+234 801 666 7777" },
];

const INVENTORY = [
  { id: "INV-001", name: "Amlodipine 5mg", category: "Cardiovascular", stock: 45, min: 50, unit: "tablets", status: "low", cost: 2500 },
  { id: "INV-002", name: "Metformin 500mg", category: "Antidiabetic", stock: 320, min: 100, unit: "tablets", status: "ok", cost: 1800 },
  { id: "INV-003", name: "IV Normal Saline 1L", category: "IV Fluids", stock: 12, min: 40, unit: "bags", status: "critical", cost: 4200 },
  { id: "INV-004", name: "Ceftriaxone 1g Inj.", category: "Antibiotics", stock: 88, min: 60, unit: "vials", status: "ok", cost: 6500 },
  { id: "INV-005", name: "Omeprazole 20mg", category: "GI", stock: 150, min: 80, unit: "capsules", status: "ok", cost: 1200 },
  { id: "INV-006", name: "Enoxaparin 40mg", category: "Anticoagulant", stock: 18, min: 30, unit: "syringes", status: "low", cost: 8900 },
];

const LAB_TESTS = [
  { id: "LAB-001", patient: "Eleanor Vance", test: "Full Blood Count", ordered: "3 Jul 09:15", doctor: "Dr. M. Okonkwo", status: "completed", result: "Abnormal" },
  { id: "LAB-002", patient: "James Whitfield", test: "CT Brain w/ Contrast", ordered: "3 Jul 09:40", doctor: "Dr. S. Patel", status: "in-progress", result: "—" },
  { id: "LAB-003", patient: "Marcus Bell", test: "Troponin I (High-Sens)", ordered: "3 Jul 07:30", doctor: "Dr. A. Kowalski", status: "completed", result: "Critical" },
  { id: "LAB-004", patient: "Sofia Mendez", test: "12-lead ECG", ordered: "3 Jul 11:10", doctor: "Dr. M. Okonkwo", status: "pending", result: "—" },
  { id: "LAB-005", patient: "Amira Hassan", test: "HbA1c + Fasting Glucose", ordered: "3 Jul 14:05", doctor: "Dr. L. Ferreira", status: "completed", result: "Normal" },
  { id: "LAB-006", patient: "Peter Obi", test: "Spirometry / PFT", ordered: "3 Jul 14:40", doctor: "Dr. S. Patel", status: "pending", result: "—" },
];

const PRESCRIPTIONS_DATA = [
  { id: "RX-0041", patient: "Eleanor Vance", medicine: "Amlodipine 5mg", dosage: "Once daily", duration: "30 days", doctor: "Dr. M. Okonkwo", issued: "1 Jul 2026", status: "dispensed" },
  { id: "RX-0042", patient: "Peter Obi", medicine: "Salbutamol Inhaler", dosage: "2 puffs PRN", duration: "14 days", doctor: "Dr. S. Patel", issued: "3 Jul 2026", status: "pending" },
  { id: "RX-0043", patient: "Amira Hassan", medicine: "Metformin 500mg", dosage: "Twice daily with meals", duration: "90 days", doctor: "Dr. L. Ferreira", issued: "3 Jul 2026", status: "dispensed" },
  { id: "RX-0044", patient: "James Whitfield", medicine: "Levetiracetam 500mg", dosage: "Twice daily", duration: "60 days", doctor: "Dr. S. Patel", issued: "30 Jun 2026", status: "pending" },
  { id: "RX-0045", patient: "David Chen", medicine: "Capecitabine 500mg", dosage: "Per chemo protocol", duration: "21-day cycle", doctor: "Dr. R. Nair", issued: "20 Jun 2026", status: "expired" },
];

const REFERRALS = [
  { id: "REF-001", patient: "Marcus Bell", from: "Dr. A. Kowalski", to: "Lagos University Teaching Hospital", reason: "Cardiac catheterisation", date: "3 Jul 2026", status: "pending" },
  { id: "REF-002", patient: "David Chen", from: "Dr. R. Nair", to: "National Orthopaedic Hospital", reason: "PET-CT Scan", date: "29 Jun 2026", status: "completed" },
  { id: "REF-003", patient: "Ruth Engström", from: "Dr. M. Okonkwo", to: "Island Cardiology Specialists", reason: "Electrophysiology study", date: "1 Jul 2026", status: "in-review" },
  { id: "REF-004", patient: "Yuki Tanaka", from: "Dr. L. Ferreira", to: "Central Lab & Diagnostics", reason: "Chest HRCT", date: "3 Jul 2026", status: "pending" },
];

const TRANSACTIONS = [
  { id: "TXN-881", patient: "Eleanor Vance", service: "Cardiology Consult", amount: 15000, method: "Card", date: "3 Jul 09:15", status: "paid" },
  { id: "TXN-882", patient: "Amira Hassan", service: "ANC Visit + Labs", amount: 22500, method: "Transfer", date: "3 Jul 10:05", status: "paid" },
  { id: "TXN-883", patient: "Peter Obi", service: "Pulmonology + PFT", amount: 38000, method: "Cash", date: "3 Jul 11:30", status: "paid" },
  { id: "TXN-884", patient: "Marcus Bell", service: "ICU Day 1", amount: 85000, method: "Insurance", date: "3 Jul 12:00", status: "pending" },
  { id: "TXN-885", patient: "Yuki Tanaka", service: "GP Consult + Meds", amount: 9500, method: "Card", date: "3 Jul 13:15", status: "paid" },
];

const DEPT_REVENUE = [
  { dept: "Cardiology", value: 42, color: "#0F7D7A" },
  { dept: "Oncology", value: 28, color: "#36A09D" },
  { dept: "Neurology", value: 18, color: "#4CAF50" },
  { dept: "Others", value: 12, color: "#E6F7F6" },
];

// ─────────────────────────────────────────────────────────────────────────────
// SHARED COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

const CARD_SHADOW = "0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.10)";
const BTN_SHADOW = "0 4px 6px -1px rgba(15,125,122,0.3)";

function StatusPill({ status }: { status: string }) {
  const m: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    confirmed:    { label: "Confirmed",    bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
    "in-progress":{ label: "In Progress", bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
    critical:     { label: "Critical",    bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444" },
    pending:      { label: "Pending",     bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B" },
    active:       { label: "Active",      bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
    discharged:   { label: "Discharged",  bg: "#F3F4F6", text: "#4B5563", dot: "#9CA3AF" },
    observation:  { label: "Observation", bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
    completed:    { label: "Completed",   bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
    "in-review":  { label: "In Review",   bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
    "on-duty":    { label: "On Duty",     bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
    "off-duty":   { label: "Off Duty",    bg: "#F3F4F6", text: "#4B5563", dot: "#9CA3AF" },
    dispensed:    { label: "Dispensed",   bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
    expired:      { label: "Expired",     bg: "#FEF2F2", text: "#991B1B", dot: "#EF4444" },
    paid:         { label: "Paid",        bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
    low:          { label: "Low Stock",   bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B" },
    ok:           { label: "In Stock",    bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
    abnormal:     { label: "Abnormal",    bg: "#FFFBEB", text: "#92400E", dot: "#F59E0B" },
    normal:       { label: "Normal",      bg: "#ECFDF5", text: "#065F46", dot: "#10B981" },
  };
  const s = m[status.toLowerCase()] ?? m.pending;
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ background: s.bg, color: s.text, boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.dot }} />
      {s.label}
    </span>
  );
}

function KpiCard({ icon: Icon, label, value, delta, deltaUp, sub, color }: {
  icon: React.ElementType; label: string; value: string;
  delta: string; deltaUp: boolean; sub: string; color: string;
}) {
  return (
    <div className="bg-card rounded-xl p-5 flex flex-col gap-3" style={{ boxShadow: CARD_SHADOW }}>
      <div className="flex items-start justify-between">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: color + "18" }}>
          <Icon size={18} style={{ color }} />
        </div>
        <span className={`flex items-center gap-1 text-xs font-medium ${deltaUp ? "text-emerald-600" : "text-red-500"}`}>
          {deltaUp ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          {delta}
        </span>
      </div>
      <div>
        <div className="text-2xl text-foreground tracking-tight font-bold">{value}</div>
        <div className="text-sm font-medium text-foreground mt-0.5">{label}</div>
        <div className="text-xs text-muted-foreground mt-1">{sub}</div>
      </div>
    </div>
  );
}

const ChartTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg p-3 text-xs" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.10)" }}>
      <p className="font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-muted-foreground">
          {p.dataKey}: <span className="text-foreground font-medium">{typeof p.value === "number" && p.value > 1000 ? `₦${p.value.toLocaleString()}` : p.value}</span>
        </p>
      ))}
    </div>
  );
};

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between mb-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function PrimaryBtn({ children, onClick, icon: Icon, small }: { children: React.ReactNode; onClick?: () => void; icon?: React.ElementType; small?: boolean }) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 font-semibold text-white rounded-lg transition-all active:scale-95 ${small ? "px-3 py-2 text-xs" : "px-4 py-2.5 text-sm"}`}
      style={{ background: "linear-gradient(135deg, #0F7D7A 0%, #0A5E5C 100%)", boxShadow: BTN_SHADOW }}>
      {Icon && <Icon size={small ? 13 : 15} />}
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick, icon: Icon }: { children: React.ReactNode; onClick?: () => void; icon?: React.ElementType }) {
  return (
    <button onClick={onClick}
      className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all border"
      style={{ color: "#0F7D7A", background: "#E6F7F6", borderColor: "rgba(15,125,122,0.15)" }}>
      {Icon && <Icon size={14} />}
      {children}
    </button>
  );
}

function SkeletonRow() {
  return (
    <tr>
      {[1,2,3,4,5].map(i => (
        <td key={i} className="px-5 py-4">
          <div className="h-3 bg-muted rounded animate-pulse" style={{ width: `${60 + i * 8}%` }} />
        </td>
      ))}
    </tr>
  );
}

function TableCard({ title, subtitle, action, children }: { title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="bg-card rounded-xl overflow-hidden" style={{ boxShadow: CARD_SHADOW }}>
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">{children}</th>;
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-5 py-3.5 text-sm ${className}`}>{children}</td>;
}

function TrHover({ children }: { children: React.ReactNode }) {
  return (
    <tr className="cursor-pointer transition-colors"
      style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
      onMouseEnter={e => (e.currentTarget.style.background = "#F8F9FA")}
      onMouseLeave={e => (e.currentTarget.style.background = "")}>
      {children}
    </tr>
  );
}

function InitialsAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const s = size === "sm" ? "w-7 h-7 text-[10px]" : "w-8 h-8 text-xs";
  return (
    <div className={`${s} rounded-full flex items-center justify-center font-semibold flex-shrink-0`}
      style={{ background: "#E6F7F6", color: "#0F7D7A" }}>
      {initials}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN LAYOUT
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_NAV = [
  { path: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { path: "patients", icon: Users, label: "Patients", badge: 3 },
  { path: "appointments", icon: Calendar, label: "Appointments" },
  { path: "consultations", icon: Stethoscope, label: "Consultations" },
  { path: "vitals", icon: Activity, label: "Vitals Dashboard" },
  { path: "labs", icon: FlaskConical, label: "Lab Tests" },
  { path: "prescriptions", icon: Pill, label: "Prescriptions" },
  { path: "inventory", icon: Package, label: "Inventory" },
  { path: "payments", icon: DollarSign, label: "Payments" },
  { path: "referrals", icon: GitBranch, label: "Referrals" },
  { path: "reports", icon: BarChart3, label: "Reports" },
  { path: "staff", icon: UserCheck, label: "Staff" },
  { path: "messages", icon: MessageSquare, label: "Messages", badge: 7 },
];

const ADMIN_BOTTOM_NAV = [
  { path: "settings", icon: Settings, label: "Settings" },
];

function AdminLayout() {
  const [unit, setUnit] = useState("General Ward A");
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Sidebar */}
      <aside className="flex flex-col w-60 flex-shrink-0 h-full overflow-y-auto" style={{ background: "#131E33" }}>
        <div className="flex items-center gap-2.5 px-5 h-16 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 2px 8px rgba(15,125,122,0.4)" }}>
            <Heart size={14} color="#fff" />
          </div>
          <span className="text-white font-semibold text-base tracking-tight">MicroHealth</span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-xs font-medium px-3 pb-2 pt-1 tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>Clinical</p>
          {ADMIN_NAV.map(({ path, icon: Icon, label, badge }) => {
            const active = location.pathname.includes(`/admin/${path}`);
            return (
              <button key={path} onClick={() => navigate(`/admin/${path}`)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
                style={{
                  background: active ? "rgba(15,125,122,0.18)" : "transparent",
                  color: active ? "#36A09D" : "rgba(226,232,240,0.72)",
                  borderLeft: active ? "2px solid #0F7D7A" : "2px solid transparent",
                }}>
                <Icon size={15} className="flex-shrink-0" />
                <span className="flex-1 text-left font-medium">{label}</span>
                {badge && <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "#0F7D7A", color: "#fff" }}>{badge}</span>}
              </button>
            );
          })}
          <p className="text-xs font-medium px-3 pb-2 pt-4 tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>System</p>
          {ADMIN_BOTTOM_NAV.map(({ path, icon: Icon, label }) => (
            <button key={path} onClick={() => navigate(`/admin/${path}`)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{ color: "rgba(226,232,240,0.55)" }}>
              <Icon size={15} />
              <span className="font-medium">{label}</span>
            </button>
          ))}
          <button onClick={() => navigate("/login")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
            style={{ color: "rgba(226,232,240,0.55)" }}>
            <LogOut size={15} />
            <span className="font-medium">Sign Out</span>
          </button>
        </nav>

        <div className="px-3 pb-4">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: "rgba(255,255,255,0.05)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: "linear-gradient(135deg, #0F7D7A, #36A09D)", color: "#fff" }}>MO</div>
            <div className="min-w-0">
              <div className="text-sm font-medium text-white truncate">Dr. M. Okonkwo</div>
              <div className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>Attending Physician</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Right panel */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-4 px-6 bg-card flex-shrink-0" style={{ height: 64, borderBottom: "1px solid rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
          <button className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium"
            style={{ background: "#F3F4F6", color: "#374151", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.07)" }}
            onClick={() => setUnit(unit === "General Ward A" ? "ICU Unit B" : "General Ward A")}>
            <span className="w-2 h-2 rounded-full bg-[#0F7D7A]" />
            {unit}
            <ChevronDown size={14} className="text-gray-400" />
          </button>
          <div className="flex-1" />
          <div className="relative hidden md:block">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input className="pl-8 pr-3 py-2 text-sm rounded-lg outline-none w-52"
              style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.07)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)", color: "#374151" }}
              placeholder="Search patients, records…" />
          </div>
          <span className="text-sm text-muted-foreground hidden lg:block">Thursday, 3 July 2026</span>
          <button className="relative w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.07)" }}>
            <Bell size={15} className="text-gray-500" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>
          <button className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold" style={{ background: "linear-gradient(135deg, #0F7D7A, #36A09D)", color: "#fff", boxShadow: "0 2px 6px rgba(15,125,122,0.35)" }}>MO</button>
        </header>
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

function LoginPage() {
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [email, setEmail] = useState("dr.okonkwo@microhealth.ng");
  const [password, setPassword] = useState("••••••••");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  function handleOtpChange(i: number, v: string) {
    if (!/^\d?$/.test(v)) return;
    const next = [...otp]; next[i] = v;
    setOtp(next);
    if (v && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function handleOtpKey(i: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
  }

  return (
    <div className="flex h-screen w-full" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Brand panel */}
      <div className="hidden lg:flex flex-col w-[480px] flex-shrink-0 p-10 relative overflow-hidden"
        style={{ background: "linear-gradient(145deg, #0A5E5C 0%, #0F7D7A 50%, #131E33 100%)" }}>
        <div className="flex items-center gap-3 mb-auto">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)" }}>
            <Heart size={18} color="#fff" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">MicroHealth</span>
        </div>
        <div className="mb-auto">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">Smarter care,<br />one record at a time.</h2>
          <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.65)" }}>
            Unified clinical operations for modern healthcare facilities. Manage patients, schedules, vitals, and revenue from one secure platform.
          </p>
        </div>
        {/* Floating stat card */}
        <div className="rounded-2xl p-5 mb-8" style={{ background: "rgba(255,255,255,0.10)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,0.15)" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>Today's patient load</span>
            <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "rgba(76,175,80,0.25)", color: "#A7F3D0" }}>+4.2%</span>
          </div>
          <div className="text-3xl font-bold text-white mb-1">38 <span className="text-lg font-normal" style={{ color: "rgba(255,255,255,0.6)" }}>appointments</span></div>
          <div className="h-1.5 rounded-full mt-3 overflow-hidden" style={{ background: "rgba(255,255,255,0.15)" }}>
            <div className="h-full rounded-full" style={{ width: "68%", background: "linear-gradient(90deg, #36A09D, #4CAF50)" }} />
          </div>
          <div className="flex justify-between text-xs mt-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
            <span>26 completed</span><span>12 remaining</span>
          </div>
        </div>
        {/* Decorative circles */}
        <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full" style={{ background: "rgba(255,255,255,0.03)" }} />
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full" style={{ background: "rgba(255,255,255,0.04)" }} />
      </div>

      {/* Form panel */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
            <p className="text-sm text-muted-foreground mt-1">Sign in to your staff portal</p>
          </div>

          {step === "credentials" ? (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-1.5">Email address</label>
                <input className="w-full px-4 py-2.5 text-sm rounded-lg outline-none transition-all"
                  style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)", color: "#111827" }}
                  value={email} onChange={e => setEmail(e.target.value)} type="email" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-foreground">Password</label>
                  <button className="text-xs font-medium" style={{ color: "#0F7D7A" }} onClick={() => navigate("/forgot-password")}>Forgot password?</button>
                </div>
                <input className="w-full px-4 py-2.5 text-sm rounded-lg outline-none transition-all"
                  style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)", color: "#111827" }}
                  value={password} onChange={e => setPassword(e.target.value)} type="password" />
              </div>
              <button className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all mt-2"
                style={{ background: "linear-gradient(135deg, #0F7D7A 0%, #0A5E5C 100%)", boxShadow: BTN_SHADOW }}
                onClick={() => setStep("otp")}>
                Continue
              </button>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
                <span className="text-xs text-muted-foreground">or quick access</span>
                <div className="flex-1 h-px" style={{ background: "rgba(0,0,0,0.08)" }} />
              </div>
              <button className="w-full py-2.5 rounded-lg text-sm font-medium border transition-all"
                style={{ color: "#374151", borderColor: "rgba(0,0,0,0.1)", background: "#fff" }}
                onClick={() => navigate("/patient/home")}>
                View Patient Experience →
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "#E6F7F6", border: "1px solid rgba(15,125,122,0.15)" }}>
                <SmartphoneNfc size={16} style={{ color: "#0F7D7A", marginTop: 2 }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "#0A5E5C" }}>Two-factor authentication</p>
                  <p className="text-xs mt-0.5" style={{ color: "#36A09D" }}>Enter the 6-digit code sent to +234 801 *** 5678</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground block mb-3">Verification code</label>
                <div className="flex gap-2">
                  {otp.map((v, i) => (
                    <input key={i} ref={el => { otpRefs.current[i] = el; }}
                      className="flex-1 h-12 text-center text-lg font-bold rounded-lg outline-none transition-all"
                      style={{ background: "#F3F4F6", border: v ? "2px solid #0F7D7A" : "1px solid rgba(0,0,0,0.1)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)", color: "#111827" }}
                      maxLength={1} value={v}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKey(i, e)} />
                  ))}
                </div>
              </div>
              <button className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-all"
                style={{ background: "linear-gradient(135deg, #0F7D7A 0%, #0A5E5C 100%)", boxShadow: BTN_SHADOW }}
                onClick={() => navigate("/admin/dashboard")}>
                Verify & Sign In
              </button>
              <button className="w-full text-sm text-muted-foreground" onClick={() => setStep("credentials")}>← Back</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

function AdminDashboard() {
  const navigate = useNavigate();
  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Good morning, Dr. Okonkwo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Here is what is happening at General Ward A today.</p>
        </div>
        <PrimaryBtn icon={Plus} onClick={() => navigate("/admin/appointments")}>New Appointment</PrimaryBtn>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Total Patients" value="1,284" delta="+4.2%" deltaUp sub="vs last month" color="#0F7D7A" />
        <KpiCard icon={Calendar} label="Appointments Today" value="38" delta="+7" deltaUp sub="12 remaining" color="#36A09D" />
        <KpiCard icon={AlertCircle} label="Critical Cases" value="6" delta="+2" deltaUp={false} sub="Require attention" color="#F44336" />
        <KpiCard icon={Activity} label="Avg Recovery Rate" value="94.1%" delta="+1.3%" deltaUp sub="Last 30 days" color="#4CAF50" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl p-5" style={{ boxShadow: CARD_SHADOW }}>
          <div className="flex items-center justify-between mb-4">
            <div><h3 className="text-base font-semibold text-foreground">Patient Flow</h3><p className="text-xs text-muted-foreground mt-0.5">Admissions vs. Discharges — 2026</p></div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#0F7D7A]" /> Admitted</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm inline-block bg-[#36A09D] opacity-50" /> Discharged</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={PATIENT_TREND} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <defs>
                <linearGradient id="gA" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0F7D7A" stopOpacity={0.2} /><stop offset="95%" stopColor="#0F7D7A" stopOpacity={0} /></linearGradient>
                <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#36A09D" stopOpacity={0.12} /><stop offset="95%" stopColor="#36A09D" stopOpacity={0} /></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="admitted" stroke="#0F7D7A" strokeWidth={2} fill="url(#gA)" dot={false} />
              <Area type="monotone" dataKey="discharged" stroke="#36A09D" strokeWidth={2} fill="url(#gD)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-xl p-5" style={{ boxShadow: CARD_SHADOW }}>
          <div className="mb-4"><h3 className="text-base font-semibold text-foreground">Ward Occupancy</h3><p className="text-xs text-muted-foreground mt-0.5">Current bed utilisation</p></div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={WARD_OCCUPANCY} layout="vertical" margin={{ top: 0, right: 4, bottom: 0, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="ward" type="category" tick={{ fontSize: 11, fill: "#6B7280" }} axisLine={false} tickLine={false} width={52} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="capacity" fill="#EEF0F4" radius={[0, 4, 4, 0]} />
              <Bar dataKey="occupied" fill="#0F7D7A" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <TableCard title="Today's Appointments" subtitle="3 July 2026" action={<GhostBtn>View all</GhostBtn>}>
            <table className="w-full text-sm">
              <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <tr><Th>Patient</Th><Th>Doctor</Th><Th>Department</Th><Th>Time</Th><Th>Status</Th><Th /></tr>
              </thead>
              <tbody>
                {APPOINTMENTS.slice(0, 5).map(apt => (
                  <TrHover key={apt.id}>
                    <Td><div className="flex items-center gap-2.5"><InitialsAvatar name={apt.patient} /><div><div className="font-medium text-foreground">{apt.patient}</div><div className="text-xs text-muted-foreground">{apt.id}</div></div></div></Td>
                    <Td className="text-foreground whitespace-nowrap">{apt.doctor}</Td>
                    <Td className="text-muted-foreground whitespace-nowrap">{apt.dept}</Td>
                    <Td><span className="flex items-center gap-1.5 whitespace-nowrap"><Clock size={12} className="text-muted-foreground" />{apt.time}</span></Td>
                    <Td><StatusPill status={apt.status} /></Td>
                    <Td><button className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted"><MoreHorizontal size={14} /></button></Td>
                  </TrHover>
                ))}
              </tbody>
            </table>
          </TableCard>
        </div>
        <div className="space-y-4">
          <div className="bg-card rounded-xl p-5" style={{ boxShadow: CARD_SHADOW }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Critical Alerts</h3>
              <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{CRITICAL_ALERTS.length}</span>
            </div>
            <div className="space-y-3">
              {CRITICAL_ALERTS.map((a, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg cursor-pointer"
                  style={{ background: a.severity === "high" ? "#FEF2F2" : "#FFFBEB", border: `1px solid ${a.severity === "high" ? "rgba(244,67,54,0.12)" : "rgba(255,183,77,0.2)"}` }}>
                  <div className={`w-1.5 rounded-full flex-shrink-0 mt-0.5 ${a.severity === "high" ? "bg-red-500" : "bg-amber-400"}`} style={{ minHeight: 32 }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-foreground truncate">{a.patient}</span>
                      <span className="text-[11px] text-muted-foreground flex-shrink-0">{a.time}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{a.ward}</div>
                    <div className="text-xs font-medium mt-1" style={{ color: a.severity === "high" ? "#B91C1C" : "#92400E" }}>{a.alert}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-card rounded-xl p-5" style={{ boxShadow: CARD_SHADOW }}>
            <h3 className="text-base font-semibold text-foreground mb-3">Shift Summary</h3>
            {[{ label: "Nurses on duty", value: "14", icon: User }, { label: "Pending labs", value: "9", icon: FlaskConical }, { label: "Surgeries today", value: "3", icon: Activity }].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex items-center justify-between py-2.5" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="flex items-center gap-2.5 text-sm text-muted-foreground"><Icon size={14} />{label}</div>
                <span className="text-sm font-semibold text-foreground">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENTS LIST
// ─────────────────────────────────────────────────────────────────────────────

function PatientsList() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const filtered = PATIENTS.filter(p =>
    (filter === "all" || p.status === filter) &&
    p.name.toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="space-y-5 pb-4">
      <PageHeader title="Patients" subtitle={`${PATIENTS.length} registered patients`} action={<PrimaryBtn icon={Plus}>Add Patient</PrimaryBtn>} />
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input className="w-full pl-8 pr-3 py-2.5 text-sm rounded-lg outline-none"
            style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.09)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}
            placeholder="Search by name, diagnosis…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {["all", "active", "critical", "discharged", "observation"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3.5 py-2 text-xs font-medium rounded-lg capitalize transition-all"
            style={{ background: filter === f ? "#0F7D7A" : "#F3F4F6", color: filter === f ? "#fff" : "#6B7280" }}>
            {f}
          </button>
        ))}
      </div>
      <TableCard title="Patient Registry" subtitle={`${filtered.length} results`}>
        <table className="w-full text-sm">
          <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            <tr><Th>Patient</Th><Th>Blood</Th><Th>Diagnosis</Th><Th>Doctor</Th><Th>Last Visit</Th><Th>Status</Th><Th>Actions</Th></tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-5 py-16 text-center">
                <Users size={32} className="mx-auto text-muted-foreground opacity-40 mb-3" />
                <p className="text-sm text-muted-foreground">No patients found</p>
              </td></tr>
            ) : filtered.map(p => (
              <TrHover key={p.id}>
                <Td><div className="flex items-center gap-2.5"><InitialsAvatar name={p.name} /><div><div className="font-medium text-foreground">{p.name}</div><div className="text-xs text-muted-foreground">{p.id} · {p.age}y {p.gender}</div></div></div></Td>
                <Td><span className="font-mono text-xs bg-muted px-2 py-0.5 rounded font-medium text-foreground">{p.blood}</span></Td>
                <Td className="text-foreground max-w-40 truncate">{p.diagnosis}</Td>
                <Td className="text-muted-foreground whitespace-nowrap">{p.doctor}</Td>
                <Td className="text-muted-foreground whitespace-nowrap">{p.lastVisit}</Td>
                <Td><StatusPill status={p.status} /></Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <button className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-[#0F7D7A] hover:bg-[#E6F7F6] transition-all" onClick={() => navigate(`/admin/patients/${p.id}`)}><Eye size={13} /></button>
                    <button className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"><Pencil size={13} /></button>
                    <button className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all"><Trash2 size={13} /></button>
                  </div>
                </Td>
              </TrHover>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT PROFILE (ADMIN VIEW)
// ─────────────────────────────────────────────────────────────────────────────

function AdminPatientProfile() {
  const navigate = useNavigate();
  const p = PATIENTS[0];
  const [tab, setTab] = useState("vitals");
  return (
    <div className="space-y-5 pb-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
        <button onClick={() => navigate("/admin/patients")} className="hover:text-foreground transition-colors">Patients</button>
        <ChevronRight size={14} />
        <span className="text-foreground font-medium">{p.name}</span>
      </div>
      <div className="bg-card rounded-xl p-6 flex items-start gap-6" style={{ boxShadow: CARD_SHADOW }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ background: "linear-gradient(135deg, #E6F7F6, #B2E8E6)", color: "#0F7D7A" }}>EV</div>
        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Full Name", value: p.name },
            { label: "Patient ID", value: p.id },
            { label: "Age / Gender", value: `${p.age}y, ${p.gender === "F" ? "Female" : "Male"}` },
            { label: "Blood Group", value: p.blood },
            { label: "Phone", value: p.phone },
            { label: "Email", value: p.email },
            { label: "Current Ward", value: p.ward },
            { label: "Attending Doctor", value: p.doctor },
          ].map(({ label, value }) => (
            <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium text-foreground mt-0.5">{value}</p></div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <StatusPill status={p.status} />
          <GhostBtn icon={Pencil}>Edit</GhostBtn>
        </div>
      </div>
      <div className="flex gap-1 p-1 rounded-xl bg-muted w-fit">
        {["vitals", "prescriptions", "labs", "history"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all"
            style={{ background: tab === t ? "#fff" : "transparent", color: tab === t ? "#0F7D7A" : "#6B7280", boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
            {t}
          </button>
        ))}
      </div>
      {tab === "vitals" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Blood Pressure", value: "142/88", unit: "mmHg", status: "warning", icon: Heart },
            { label: "Heart Rate", value: "78", unit: "bpm", status: "normal", icon: Activity },
            { label: "Temperature", value: "37.1", unit: "°C", status: "normal", icon: Thermometer },
            { label: "SpO₂", value: "98%", unit: "oxygen sat", status: "normal", icon: Zap },
          ].map(({ label, value, unit, status, icon: Icon }) => (
            <div key={label} className="bg-card rounded-xl p-4" style={{ boxShadow: CARD_SHADOW }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: status === "warning" ? "#FFFBEB" : "#E6F7F6" }}>
                  <Icon size={15} style={{ color: status === "warning" ? "#F59E0B" : "#0F7D7A" }} />
                </div>
                <StatusPill status={status === "warning" ? "pending" : "active"} />
              </div>
              <div className="text-2xl font-bold text-foreground">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
              <div className="text-xs text-muted-foreground">{unit}</div>
            </div>
          ))}
        </div>
      )}
      {tab === "prescriptions" && (
        <TableCard title="Active Prescriptions">
          <table className="w-full text-sm">
            <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}><tr><Th>Medicine</Th><Th>Dosage</Th><Th>Duration</Th><Th>Status</Th></tr></thead>
            <tbody>
              {PRESCRIPTIONS_DATA.filter(rx => rx.patient === p.name).map(rx => (
                <TrHover key={rx.id}><Td className="font-medium text-foreground">{rx.medicine}</Td><Td className="text-muted-foreground">{rx.dosage}</Td><Td className="text-muted-foreground">{rx.duration}</Td><Td><StatusPill status={rx.status} /></Td></TrHover>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
      {tab === "labs" && (
        <TableCard title="Lab Results">
          <table className="w-full text-sm">
            <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}><tr><Th>Test</Th><Th>Ordered</Th><Th>Status</Th><Th>Result</Th></tr></thead>
            <tbody>
              {LAB_TESTS.filter(l => l.patient === p.name).map(l => (
                <TrHover key={l.id}><Td className="font-medium text-foreground">{l.test}</Td><Td className="text-muted-foreground">{l.ordered}</Td><Td><StatusPill status={l.status} /></Td><Td className="text-muted-foreground">{l.result}</Td></TrHover>
              ))}
            </tbody>
          </table>
        </TableCard>
      )}
      {tab === "history" && (
        <div className="bg-card rounded-xl p-5 space-y-4" style={{ boxShadow: CARD_SHADOW }}>
          <h3 className="text-base font-semibold text-foreground">Visit History</h3>
          {["28 Jun 2026 — Cardiology follow-up. BP monitoring, ECG.", "14 Jun 2026 — BP spike — Admitted 2 days, discharged stable.", "01 Jun 2026 — Routine consult. Medication adjusted."].map((h, i) => (
            <div key={i} className="flex gap-3">
              <div className="flex flex-col items-center"><div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#0F7D7A" }} />{i < 2 && <div className="w-px flex-1 mt-1" style={{ background: "rgba(0,0,0,0.08)" }} />}</div>
              <p className="text-sm text-foreground pb-4">{h}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APPOINTMENTS
// ─────────────────────────────────────────────────────────────────────────────

function AppointmentsPage() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [statusFilter, setStatusFilter] = useState("all");
  const filtered = APPOINTMENTS.filter(a => statusFilter === "all" || a.status === statusFilter);
  return (
    <div className="space-y-5 pb-4">
      <PageHeader title="Appointments" subtitle="3 July 2026 — All departments" action={<PrimaryBtn icon={Plus}>Book Appointment</PrimaryBtn>} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-1 p-1 rounded-xl bg-muted w-fit">
          {(["list", "calendar"] as const).map(v => (
            <button key={v} onClick={() => setView(v)}
              className="px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all"
              style={{ background: view === v ? "#fff" : "transparent", color: view === v ? "#0F7D7A" : "#6B7280", boxShadow: view === v ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
              {v}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {["all", "confirmed", "pending", "in-progress", "critical"].map(f => (
            <button key={f} onClick={() => setStatusFilter(f)}
              className="px-3 py-1.5 text-xs font-medium rounded-lg capitalize transition-all"
              style={{ background: statusFilter === f ? "#0F7D7A" : "#F3F4F6", color: statusFilter === f ? "#fff" : "#6B7280" }}>
              {f}
            </button>
          ))}
        </div>
      </div>
      {view === "list" ? (
        <TableCard title={`${filtered.length} Appointments`} action={<GhostBtn icon={Filter}>Filter</GhostBtn>}>
          <table className="w-full text-sm">
            <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}><tr><Th>Patient</Th><Th>Doctor</Th><Th>Department</Th><Th>Date</Th><Th>Time</Th><Th>Status</Th><Th /></tr></thead>
            <tbody>
              {filtered.map(apt => (
                <TrHover key={apt.id}>
                  <Td><div className="flex items-center gap-2.5"><InitialsAvatar name={apt.patient} /><div><div className="font-medium text-foreground">{apt.patient}</div><div className="text-xs text-muted-foreground">{apt.id}</div></div></div></Td>
                  <Td className="text-foreground whitespace-nowrap">{apt.doctor}</Td>
                  <Td className="text-muted-foreground">{apt.dept}</Td>
                  <Td className="text-muted-foreground whitespace-nowrap">{apt.date}</Td>
                  <Td><span className="flex items-center gap-1.5 whitespace-nowrap"><Clock size={12} className="text-muted-foreground" />{apt.time}</span></Td>
                  <Td><StatusPill status={apt.status} /></Td>
                  <Td><button className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted"><MoreHorizontal size={14} /></button></Td>
                </TrHover>
              ))}
            </tbody>
          </table>
        </TableCard>
      ) : (
        <div className="bg-card rounded-xl p-5" style={{ boxShadow: CARD_SHADOW }}>
          <div className="grid grid-cols-7 gap-2 text-center mb-3">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(d => (
              <div key={d} className="text-xs font-semibold text-muted-foreground uppercase py-2">{d}</div>
            ))}
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 1;
              const isToday = day === 2;
              const hasAppts = [2, 6, 9, 14, 16, 22].includes(day);
              return (
                <div key={i} className={`h-16 rounded-lg flex flex-col items-center pt-2 cursor-pointer transition-all ${isToday ? "ring-2 ring-[#0F7D7A]" : ""}`}
                  style={{ background: isToday ? "#E6F7F6" : day >= 0 ? "#F8F9FA" : "transparent" }}>
                  {day >= 0 && <span className={`text-sm font-medium ${isToday ? "text-[#0F7D7A]" : "text-foreground"}`}>{day + 1}</span>}
                  {hasAppts && <span className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: "#0F7D7A" }} />}
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 space-y-2" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
            <p className="text-sm font-semibold text-foreground">3 July — 8 appointments</p>
            {APPOINTMENTS.slice(0, 3).map(apt => (
              <div key={apt.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: "#F8F9FA" }}>
                <span className="text-xs font-medium text-muted-foreground w-16 flex-shrink-0">{apt.time}</span>
                <InitialsAvatar name={apt.patient} size="sm" />
                <span className="text-sm font-medium text-foreground flex-1">{apt.patient}</span>
                <StatusPill status={apt.status} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VITALS DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

function VitalsDashboard() {
  const bpData = [
    { time: "06:00", systolic: 142, diastolic: 88 },
    { time: "09:00", systolic: 138, diastolic: 85 },
    { time: "12:00", systolic: 145, diastolic: 92 },
    { time: "15:00", systolic: 133, diastolic: 82 },
    { time: "18:00", systolic: 140, diastolic: 87 },
  ];
  return (
    <div className="space-y-5 pb-4">
      <PageHeader title="Vitals Dashboard" subtitle="Monitoring abnormal readings requiring review" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={AlertTriangle} label="Abnormal Readings" value="14" delta="+3" deltaUp={false} sub="Since 6:00 AM" color="#F44336" />
        <KpiCard icon={Heart} label="High BP Cases" value="6" delta="+1" deltaUp={false} sub="Systolic > 140" color="#EF4444" />
        <KpiCard icon={Activity} label="Tachycardia" value="3" delta="-1" deltaUp sub="HR > 100 bpm" color="#F59E0B" />
        <KpiCard icon={Zap} label="Low SpO₂" value="2" delta="0" deltaUp sub="SpO₂ < 94%" color="#8B5CF6" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-5" style={{ boxShadow: CARD_SHADOW }}>
          <h3 className="text-base font-semibold text-foreground mb-1">Blood Pressure Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Eleanor Vance · Ward Cardio-2 · Today</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={bpData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="time" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} domain={[70, 160]} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="systolic" stroke="#F44336" strokeWidth={2} dot={{ r: 3, fill: "#F44336" }} />
              <Line type="monotone" dataKey="diastolic" stroke="#0F7D7A" strokeWidth={2} dot={{ r: 3, fill: "#0F7D7A" }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 rounded-sm inline-block bg-red-500" /> Systolic</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-1 rounded-sm inline-block bg-[#0F7D7A]" /> Diastolic</span>
          </div>
        </div>
        <div className="bg-card rounded-xl p-5" style={{ boxShadow: CARD_SHADOW }}>
          <h3 className="text-base font-semibold text-foreground mb-4">Latest Abnormal Readings</h3>
          <div className="space-y-3">
            {[
              { patient: "Marcus Bell", metric: "BP", value: "178/112 mmHg", ref: "< 130/80", severity: "high" },
              { patient: "Ruth Engström", metric: "HR", value: "118 bpm", ref: "60–100 bpm", severity: "high" },
              { patient: "Peter Obi", metric: "SpO₂", value: "91%", ref: "> 95%", severity: "medium" },
              { patient: "James Whitfield", metric: "Temp", value: "38.9°C", ref: "36.1–37.2°C", severity: "medium" },
            ].map((r, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: r.severity === "high" ? "#FEF2F2" : "#FFFBEB", border: `1px solid ${r.severity === "high" ? "rgba(244,67,54,0.1)" : "rgba(255,183,77,0.2)"}` }}>
                <InitialsAvatar name={r.patient} size="sm" />
                <div className="flex-1"><div className="text-sm font-medium text-foreground">{r.patient}</div><div className="text-xs text-muted-foreground">{r.metric}: {r.value} · Ref: {r.ref}</div></div>
                <StatusPill status={r.severity === "high" ? "critical" : "pending"} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LAB TESTS
// ─────────────────────────────────────────────────────────────────────────────

function LabTestsPage() {
  return (
    <div className="space-y-5 pb-4">
      <PageHeader title="Lab Tests" subtitle="Ordered tests for 3 July 2026" action={<PrimaryBtn icon={Plus}>Order Test</PrimaryBtn>} />
      <div className="grid grid-cols-3 gap-4">
        {[{ label: "Total Ordered", value: "24", color: "#0F7D7A" }, { label: "In Progress", value: "6", color: "#3B82F6" }, { label: "Awaiting Review", value: "4", color: "#F59E0B" }].map(s => (
          <div key={s.label} className="bg-card rounded-xl p-4 flex items-center gap-4" style={{ boxShadow: CARD_SHADOW }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: s.color + "18" }}><FlaskConical size={18} style={{ color: s.color }} /></div>
            <div><div className="text-2xl font-bold text-foreground">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
          </div>
        ))}
      </div>
      <TableCard title="Test Orders" action={<GhostBtn icon={Download}>Export</GhostBtn>}>
        <table className="w-full text-sm">
          <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}><tr><Th>Test ID</Th><Th>Patient</Th><Th>Test</Th><Th>Ordered</Th><Th>Doctor</Th><Th>Status</Th><Th>Result</Th></tr></thead>
          <tbody>
            {LAB_TESTS.map(l => (
              <TrHover key={l.id}>
                <Td><span className="font-mono text-xs text-muted-foreground">{l.id}</span></Td>
                <Td><div className="flex items-center gap-2.5"><InitialsAvatar name={l.patient} size="sm" /><span className="font-medium text-foreground">{l.patient}</span></div></Td>
                <Td className="text-foreground font-medium">{l.test}</Td>
                <Td className="text-muted-foreground whitespace-nowrap">{l.ordered}</Td>
                <Td className="text-muted-foreground whitespace-nowrap">{l.doctor}</Td>
                <Td><StatusPill status={l.status} /></Td>
                <Td>{l.result !== "—" ? <StatusPill status={l.result.toLowerCase()} /> : <span className="text-muted-foreground text-xs">Pending</span>}</Td>
              </TrHover>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PRESCRIPTIONS (ADMIN)
// ─────────────────────────────────────────────────────────────────────────────

function PrescriptionsPage() {
  const [tab, setTab] = useState("all");
  const filtered = tab === "all" ? PRESCRIPTIONS_DATA : PRESCRIPTIONS_DATA.filter(r => r.status === tab);
  return (
    <div className="space-y-5 pb-4">
      <PageHeader title="Prescriptions" subtitle="Manage and track all issued prescriptions" action={<PrimaryBtn icon={Plus}>New Prescription</PrimaryBtn>} />
      <div className="flex gap-1 p-1 rounded-xl bg-muted w-fit">
        {["all", "pending", "dispensed", "expired"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-2 text-sm font-medium rounded-lg capitalize transition-all"
            style={{ background: tab === t ? "#fff" : "transparent", color: tab === t ? "#0F7D7A" : "#6B7280", boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
            {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <TableCard title={`${filtered.length} Prescriptions`}>
        <table className="w-full text-sm">
          <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}><tr><Th>Rx ID</Th><Th>Patient</Th><Th>Medicine</Th><Th>Dosage</Th><Th>Doctor</Th><Th>Issued</Th><Th>Status</Th></tr></thead>
          <tbody>
            {filtered.map(rx => (
              <TrHover key={rx.id}>
                <Td><span className="font-mono text-xs text-muted-foreground">{rx.id}</span></Td>
                <Td><div className="flex items-center gap-2.5"><InitialsAvatar name={rx.patient} size="sm" /><span className="font-medium text-foreground">{rx.patient}</span></div></Td>
                <Td className="text-foreground font-medium">{rx.medicine}</Td>
                <Td className="text-muted-foreground">{rx.dosage}</Td>
                <Td className="text-muted-foreground whitespace-nowrap">{rx.doctor}</Td>
                <Td className="text-muted-foreground whitespace-nowrap">{rx.issued}</Td>
                <Td><StatusPill status={rx.status} /></Td>
              </TrHover>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INVENTORY
// ─────────────────────────────────────────────────────────────────────────────

function InventoryPage() {
  const lowStock = INVENTORY.filter(i => i.status !== "ok").length;
  return (
    <div className="space-y-5 pb-4">
      <PageHeader title="Inventory" subtitle="Pharmacy & medical supplies stock" action={<PrimaryBtn icon={Plus}>Add Item</PrimaryBtn>} />
      <div className="grid grid-cols-3 gap-4">
        <KpiCard icon={Package} label="Total Items" value={`${INVENTORY.length * 14}`} delta="+2" deltaUp sub="SKUs tracked" color="#0F7D7A" />
        <KpiCard icon={AlertTriangle} label="Low / Critical Stock" value={`${lowStock}`} delta="+1" deltaUp={false} sub="Reorder required" color="#F59E0B" />
        <KpiCard icon={DollarSign} label="Stock Value" value="₦2.4M" delta="+₦120k" deltaUp sub="Estimated total" color="#4CAF50" />
      </div>
      {lowStock > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl" style={{ background: "#FFFBEB", border: "1px solid rgba(245,158,11,0.2)" }}>
          <AlertTriangle size={16} style={{ color: "#F59E0B", marginTop: 2 }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: "#92400E" }}>{lowStock} items need reordering</p>
            <p className="text-xs mt-0.5" style={{ color: "#B45309" }}>IV Normal Saline is at critical level (12 bags remaining). Immediate reorder recommended.</p>
          </div>
        </div>
      )}
      <TableCard title="Stock Register" action={<GhostBtn icon={Download}>Export CSV</GhostBtn>}>
        <table className="w-full text-sm">
          <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}><tr><Th>Item</Th><Th>Category</Th><Th>In Stock</Th><Th>Min Stock</Th><Th>Unit Cost</Th><Th>Status</Th><Th /></tr></thead>
          <tbody>
            {INVENTORY.map(item => (
              <TrHover key={item.id}>
                <Td className="font-medium text-foreground">{item.name}</Td>
                <Td className="text-muted-foreground">{item.category}</Td>
                <Td><span className={`font-semibold ${item.stock < item.min ? "text-red-600" : "text-foreground"}`}>{item.stock} {item.unit}</span></Td>
                <Td className="text-muted-foreground">{item.min} {item.unit}</Td>
                <Td className="text-muted-foreground">₦{item.cost.toLocaleString()}</Td>
                <Td><StatusPill status={item.status === "critical" ? "critical" : item.status === "low" ? "low" : "ok"} /></Td>
                <Td><button className="text-xs font-medium px-2.5 py-1 rounded-lg transition-all" style={{ color: "#0F7D7A", background: "#E6F7F6" }}>Reorder</button></Td>
              </TrHover>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAYMENTS & REVENUE
// ─────────────────────────────────────────────────────────────────────────────

function PaymentsPage() {
  return (
    <div className="space-y-5 pb-4">
      <PageHeader title="Payments & Revenue" subtitle="Financial overview — July 2026" action={<GhostBtn icon={Download}>Export Report</GhostBtn>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={DollarSign} label="Today's Revenue" value="₦964,500" delta="+12.4%" deltaUp sub="vs yesterday" color="#0F7D7A" />
        <KpiCard icon={ClipboardList} label="Transactions" value="288" delta="+24" deltaUp sub="Today" color="#36A09D" />
        <KpiCard icon={TU} label="Avg Transaction" value="₦3,348" delta="+₦240" deltaUp sub="Per patient" color="#4CAF50" />
        <KpiCard icon={AlertCircle} label="Pending Payments" value="₦85,000" delta="-₦12k" deltaUp sub="Insurance claims" color="#F59E0B" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card rounded-xl p-5" style={{ boxShadow: CARD_SHADOW }}>
          <h3 className="text-base font-semibold text-foreground mb-1">Weekly Revenue</h3>
          <p className="text-xs text-muted-foreground mb-4">Mon 29 Jun — Sun 5 Jul 2026</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={REVENUE_TREND} margin={{ top: 4, right: 4, bottom: 0, left: -4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="revenue" fill="#0F7D7A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-xl p-5" style={{ boxShadow: CARD_SHADOW }}>
          <h3 className="text-base font-semibold text-foreground mb-4">Revenue by Department</h3>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart><Pie data={DEPT_REVENUE} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
              {DEPT_REVENUE.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie><Tooltip /></PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-2">
            {DEPT_REVENUE.map(d => (
              <div key={d.dept} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} /><span className="text-muted-foreground">{d.dept}</span></div>
                <span className="font-medium text-foreground">{d.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <TableCard title="Transaction History" action={<GhostBtn icon={Download}>CSV</GhostBtn>}>
        <table className="w-full text-sm">
          <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}><tr><Th>TXN ID</Th><Th>Patient</Th><Th>Service</Th><Th>Amount</Th><Th>Method</Th><Th>Date</Th><Th>Status</Th></tr></thead>
          <tbody>
            {TRANSACTIONS.map(t => (
              <TrHover key={t.id}>
                <Td><span className="font-mono text-xs text-muted-foreground">{t.id}</span></Td>
                <Td><div className="flex items-center gap-2.5"><InitialsAvatar name={t.patient} size="sm" /><span className="font-medium text-foreground">{t.patient}</span></div></Td>
                <Td className="text-muted-foreground">{t.service}</Td>
                <Td className="font-semibold text-foreground">₦{t.amount.toLocaleString()}</Td>
                <Td className="text-muted-foreground">{t.method}</Td>
                <Td className="text-muted-foreground whitespace-nowrap">{t.date}</Td>
                <Td><StatusPill status={t.status} /></Td>
              </TrHover>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REFERRALS
// ─────────────────────────────────────────────────────────────────────────────

function ReferralsPage() {
  return (
    <div className="space-y-5 pb-4">
      <PageHeader title="Referrals" subtitle="Outgoing referrals to external facilities" action={<PrimaryBtn icon={Plus}>New Referral</PrimaryBtn>} />
      <div className="grid grid-cols-3 gap-4">
        {[{ label: "Total Referrals", v: "4", c: "#0F7D7A" }, { label: "In Review", v: "1", c: "#3B82F6" }, { label: "Completed", v: "1", c: "#10B981" }].map(s => (
          <div key={s.label} className="bg-card rounded-xl p-4 flex items-center gap-4" style={{ boxShadow: CARD_SHADOW }}>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: s.c + "18" }}><GitBranch size={18} style={{ color: s.c }} /></div>
            <div><div className="text-2xl font-bold text-foreground">{s.v}</div><div className="text-xs text-muted-foreground">{s.label}</div></div>
          </div>
        ))}
      </div>
      <TableCard title="All Referrals">
        <table className="w-full text-sm">
          <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}><tr><Th>Ref ID</Th><Th>Patient</Th><Th>From</Th><Th>To Facility</Th><Th>Reason</Th><Th>Date</Th><Th>Status</Th></tr></thead>
          <tbody>
            {REFERRALS.map(r => (
              <TrHover key={r.id}>
                <Td><span className="font-mono text-xs text-muted-foreground">{r.id}</span></Td>
                <Td className="font-medium text-foreground">{r.patient}</Td>
                <Td className="text-muted-foreground whitespace-nowrap">{r.from}</Td>
                <Td className="text-muted-foreground">{r.to}</Td>
                <Td className="text-muted-foreground max-w-48 truncate">{r.reason}</Td>
                <Td className="text-muted-foreground whitespace-nowrap">{r.date}</Td>
                <Td><StatusPill status={r.status} /></Td>
              </TrHover>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSULTATIONS
// ─────────────────────────────────────────────────────────────────────────────

function ConsultationsPage() {
  return (
    <div className="space-y-5 pb-4">
      <PageHeader title="Consultations" subtitle="All clinical visits and diagnoses" action={<PrimaryBtn icon={Plus}>Log Consultation</PrimaryBtn>} />
      <TableCard title="Consultation Records" action={<GhostBtn icon={Filter}>Filter</GhostBtn>}>
        <table className="w-full text-sm">
          <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}><tr><Th>Patient</Th><Th>Provider</Th><Th>Type</Th><Th>Diagnosis</Th><Th>Date</Th><Th>Status</Th></tr></thead>
          <tbody>
            {PATIENTS.map((p, i) => (
              <TrHover key={p.id}>
                <Td><div className="flex items-center gap-2.5"><InitialsAvatar name={p.name} size="sm" /><span className="font-medium text-foreground">{p.name}</span></div></Td>
                <Td className="text-muted-foreground whitespace-nowrap">{p.doctor}</Td>
                <Td className="text-muted-foreground">{["Follow-up", "New Consult", "Emergency", "Review"][i % 4]}</Td>
                <Td className="text-foreground max-w-40 truncate">{p.diagnosis}</Td>
                <Td className="text-muted-foreground whitespace-nowrap">{p.lastVisit}</Td>
                <Td><StatusPill status={["completed", "in-progress", "pending"][i % 3]} /></Td>
              </TrHover>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REPORTS & ANALYTICS
// ─────────────────────────────────────────────────────────────────────────────

function ReportsPage() {
  return (
    <div className="space-y-5 pb-4">
      <PageHeader title="Reports & Analytics" subtitle="Clinical and financial insights" action={<div className="flex gap-2"><GhostBtn icon={Download}>Export CSV</GhostBtn><PrimaryBtn icon={Download}>Export PDF</PrimaryBtn></div>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Total Patients (July)" value="210" delta="+8.1%" deltaUp sub="vs June (194)" color="#0F7D7A" />
        <KpiCard icon={Stethoscope} label="Consultations" value="342" delta="+5.3%" deltaUp sub="vs June (325)" color="#36A09D" />
        <KpiCard icon={DollarSign} label="Monthly Revenue" value="₦12.3M" delta="+9.7%" deltaUp sub="vs June (₦11.2M)" color="#4CAF50" />
        <KpiCard icon={Activity} label="Recovery Rate" value="94.1%" delta="+1.3%" deltaUp sub="vs June (92.8%)" color="#8B5CF6" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-card rounded-xl p-5" style={{ boxShadow: CARD_SHADOW }}>
          <h3 className="text-base font-semibold text-foreground mb-1">Patient Demographics</h3>
          <p className="text-xs text-muted-foreground mb-4">Age group distribution</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[{ age: "0–12", count: 45 }, { age: "13–25", count: 62 }, { age: "26–40", count: 118 }, { age: "41–60", count: 143 }, { age: "61+", count: 88 }]} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" fill="#0F7D7A" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-xl p-5" style={{ boxShadow: CARD_SHADOW }}>
          <h3 className="text-base font-semibold text-foreground mb-1">Consultation Trends</h3>
          <p className="text-xs text-muted-foreground mb-4">January – July 2026</p>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={PATIENT_TREND} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
              <defs><linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0F7D7A" stopOpacity={0.2} /><stop offset="95%" stopColor="#0F7D7A" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Area type="monotone" dataKey="admitted" stroke="#0F7D7A" strokeWidth={2} fill="url(#gR)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// STAFF MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

function StaffPage() {
  return (
    <div className="space-y-5 pb-4">
      <PageHeader title="Staff Management" subtitle="Clinical and administrative team directory" action={<PrimaryBtn icon={Plus}>Add Staff</PrimaryBtn>} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Users} label="Total Staff" value="42" delta="+2" deltaUp sub="Active members" color="#0F7D7A" />
        <KpiCard icon={UserCheck} label="On Duty Now" value="28" delta="+3" deltaUp sub="Across all wards" color="#4CAF50" />
        <KpiCard icon={Stethoscope} label="Physicians" value="12" delta="0" deltaUp sub="All departments" color="#36A09D" />
        <KpiCard icon={Heart} label="Nursing Staff" value="18" delta="+1" deltaUp sub="Including head nurses" color="#8B5CF6" />
      </div>
      <TableCard title="Staff Directory" action={<GhostBtn icon={Filter}>Filter by Dept</GhostBtn>}>
        <table className="w-full text-sm">
          <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}><tr><Th>Staff Member</Th><Th>Role</Th><Th>Department</Th><Th>Patients</Th><Th>Contact</Th><Th>Status</Th></tr></thead>
          <tbody>
            {STAFF.map(s => (
              <TrHover key={s.id}>
                <Td><div className="flex items-center gap-2.5"><InitialsAvatar name={s.name} /><div><div className="font-medium text-foreground">{s.name}</div><div className="text-xs text-muted-foreground">{s.id}</div></div></div></Td>
                <Td className="text-muted-foreground">{s.role}</Td>
                <Td className="text-muted-foreground">{s.dept}</Td>
                <Td><span className="font-semibold text-foreground">{s.patients}</span></Td>
                <Td className="text-muted-foreground">{s.phone}</Td>
                <Td><StatusPill status={s.status} /></Td>
              </TrHover>
            ))}
          </tbody>
        </table>
      </TableCard>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

function SettingsPage() {
  const [saved, setSaved] = useState(false);
  return (
    <div className="space-y-5 pb-4 max-w-3xl">
      <PageHeader title="Settings" subtitle="Manage your profile and system preferences" />
      {saved && (
        <div className="flex items-center gap-2 p-3 rounded-xl text-sm font-medium" style={{ background: "#ECFDF5", color: "#065F46", border: "1px solid rgba(16,185,129,0.2)" }}>
          <CheckCircle size={16} style={{ color: "#10B981" }} /> Changes saved successfully.
        </div>
      )}
      <div className="bg-card rounded-xl p-6 space-y-5" style={{ boxShadow: CARD_SHADOW }}>
        <h3 className="text-base font-semibold text-foreground">Unit Details</h3>
        <div className="grid grid-cols-2 gap-4">
          {[{ label: "Facility Name", value: "MicroHealth General", icon: Building2 }, { label: "Unit Name", value: "General Ward A", icon: Home }, { label: "Facility Address", value: "14 Adeola Hopewell, Lagos", icon: MapPin }, { label: "Contact Phone", value: "+234 801 000 0000", icon: Phone }].map(({ label, value, icon: Icon }) => (
            <div key={label}>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
              <div className="relative">
                <Icon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg outline-none"
                  style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}
                  defaultValue={value} />
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card rounded-xl p-6 space-y-4" style={{ boxShadow: CARD_SHADOW }}>
        <h3 className="text-base font-semibold text-foreground">User Profile</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold" style={{ background: "linear-gradient(135deg, #E6F7F6, #B2E8E6)", color: "#0F7D7A" }}>MO</div>
          <div>
            <p className="text-sm font-semibold text-foreground">Dr. Mfon Okonkwo</p>
            <p className="text-xs text-muted-foreground mt-0.5">Attending Physician · Cardiology</p>
            <button className="text-xs font-medium mt-1.5" style={{ color: "#0F7D7A" }}>Change photo</button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[{ label: "Display Name", value: "Dr. M. Okonkwo" }, { label: "Email Address", value: "dr.okonkwo@microhealth.ng" }].map(({ label, value }) => (
            <div key={label}>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
              <input className="w-full px-3 py-2.5 text-sm rounded-lg outline-none"
                style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}
                defaultValue={value} />
            </div>
          ))}
        </div>
      </div>
      <div className="bg-card rounded-xl p-6 space-y-4" style={{ boxShadow: CARD_SHADOW }}>
        <h3 className="text-base font-semibold text-foreground">Security</h3>
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#F8F9FA" }}>
          <div className="flex items-center gap-3"><Lock size={15} className="text-muted-foreground" /><div><p className="text-sm font-medium text-foreground">Password</p><p className="text-xs text-muted-foreground">Last changed 30 days ago</p></div></div>
          <GhostBtn icon={KeyRound}>Change</GhostBtn>
        </div>
        <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: "#E6F7F6" }}>
          <div className="flex items-center gap-3"><SmartphoneNfc size={15} style={{ color: "#0F7D7A" }} /><div><p className="text-sm font-medium text-foreground">Two-Factor Authentication</p><p className="text-xs text-muted-foreground">Enabled via SMS</p></div></div>
          <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: "#D1FAE5", color: "#065F46" }}>Enabled</span>
        </div>
      </div>
      <PrimaryBtn onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000); }}>Save Changes</PrimaryBtn>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES (ADMIN STUB)
// ─────────────────────────────────────────────────────────────────────────────

function MessagesPage() {
  return (
    <div className="space-y-5 pb-4">
      <PageHeader title="Messages" subtitle="Internal communications and patient reminders" action={<PrimaryBtn icon={Plus}>New Message</PrimaryBtn>} />
      <div className="bg-card rounded-xl" style={{ boxShadow: CARD_SHADOW }}>
        {[{ from: "Dr. S. Patel", msg: "Can you review James Whitfield's CT before 2 PM?", time: "10:32 AM", unread: true },
          { from: "Nurse A. Ibrahim", msg: "ICU Bed 3 requires medication restock.", time: "09:15 AM", unread: true },
          { from: "Dr. L. Ferreira", msg: "Amira Hassan cleared for discharge tomorrow.", time: "Yesterday", unread: false },
          { from: "Admin — System", msg: "Scheduled maintenance Sunday 05:00–06:00 AM.", time: "Yesterday", unread: false },
        ].map((m, i, arr) => (
          <div key={i} className="flex items-start gap-3 px-5 py-4 cursor-pointer transition-colors"
            style={{ borderBottom: i < arr.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none", background: m.unread ? "#F8FFFF" : "transparent" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#F8F9FA")}
            onMouseLeave={e => (e.currentTarget.style.background = m.unread ? "#F8FFFF" : "transparent")}>
            <InitialsAvatar name={m.from} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between"><span className="text-sm font-semibold text-foreground">{m.from}</span><span className="text-xs text-muted-foreground">{m.time}</span></div>
              <p className="text-sm text-muted-foreground mt-0.5 truncate">{m.msg}</p>
            </div>
            {m.unread && <span className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ background: "#0F7D7A" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT LAYOUT (MOBILE)
// ─────────────────────────────────────────────────────────────────────────────

const PATIENT_BOTTOM_NAV = [
  { path: "home", icon: Home, label: "Home" },
  { path: "appointments", icon: Calendar, label: "Appts" },
  { path: "vitals", icon: Activity, label: "Health" },
  { path: "messages", icon: MessageSquare, label: "Messages" },
  { path: "profile", icon: User, label: "Profile" },
];

function PatientLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="relative flex flex-col bg-white overflow-hidden" style={{ width: 375, height: 812, boxShadow: "0 24px 80px rgba(0,0,0,0.18)", borderRadius: 32 }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-12 pb-4 flex-shrink-0 bg-white" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
          <div>
            <p className="text-xs text-muted-foreground">Good morning,</p>
            <p className="text-base font-semibold text-foreground">Yuki Tanaka</p>
          </div>
          <button className="relative w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#F3F4F6" }}>
            <Bell size={16} className="text-gray-500" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" />
          </button>
        </div>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto">
          <Outlet />
        </div>

        {/* Bottom nav */}
        <div className="flex-shrink-0 bg-white px-2 pt-2 pb-6" style={{ borderTop: "1px solid rgba(0,0,0,0.06)", boxShadow: "0 -4px 12px rgba(0,0,0,0.04)" }}>
          <div className="flex">
            {PATIENT_BOTTOM_NAV.map(({ path, icon: Icon, label }) => {
              const active = location.pathname.includes(`/patient/${path}`);
              return (
                <button key={path} onClick={() => navigate(`/patient/${path}`)}
                  className="flex-1 flex flex-col items-center gap-1 py-2 transition-all">
                  <Icon size={20} style={{ color: active ? "#0F7D7A" : "#9CA3AF" }} />
                  <span className="text-[10px] font-medium" style={{ color: active ? "#0F7D7A" : "#9CA3AF" }}>{label}</span>
                  {active && <span className="w-1 h-1 rounded-full" style={{ background: "#0F7D7A" }} />}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT LOGIN
// ─────────────────────────────────────────────────────────────────────────────

function PatientLoginPage() {
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("+234 803 456 7890");
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
            <Heart size={20} color="#fff" />
          </div>
          <span className="text-xl font-bold text-foreground">MicroHealth</span>
        </div>
        <div className="bg-card rounded-2xl p-6" style={{ boxShadow: CARD_SHADOW }}>
          {step === "phone" ? (
            <>
              <h2 className="text-xl font-bold text-foreground mb-1">Welcome back</h2>
              <p className="text-sm text-muted-foreground mb-6">Enter your phone number to sign in</p>
              <label className="text-xs font-medium text-muted-foreground block mb-1.5">Phone Number</label>
              <div className="flex gap-2 mb-4">
                <span className="flex items-center px-3 text-sm font-medium rounded-lg" style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)" }}>🇳🇬</span>
                <input className="flex-1 px-3 py-2.5 text-sm rounded-lg outline-none"
                  style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}
                  value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <button className="w-full py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg, #0F7D7A 0%, #0A5E5C 100%)", boxShadow: BTN_SHADOW }}
                onClick={() => setStep("otp")}>
                Send OTP Code
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-foreground mb-1">Enter OTP</h2>
              <p className="text-sm text-muted-foreground mb-6">Code sent to {phone}</p>
              <div className="flex gap-2 mb-6">
                {[1,2,3,4,5,6].map(i => (
                  <input key={i} maxLength={1}
                    className="flex-1 h-12 text-center text-lg font-bold rounded-lg outline-none"
                    style={{ background: "#F3F4F6", border: i === 1 ? "2px solid #0F7D7A" : "1px solid rgba(0,0,0,0.1)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }} />
                ))}
              </div>
              <button className="w-full py-3 rounded-xl text-sm font-semibold text-white mb-3"
                style={{ background: "linear-gradient(135deg, #0F7D7A 0%, #0A5E5C 100%)", boxShadow: BTN_SHADOW }}
                onClick={() => navigate("/patient/home")}>
                Verify & Sign In
              </button>
              <button className="w-full text-sm text-center text-muted-foreground" onClick={() => setStep("phone")}>← Change number</button>
            </>
          )}
        </div>
        <button className="w-full text-sm text-center text-muted-foreground mt-4" onClick={() => navigate("/login")}>Staff portal →</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT HOME
// ─────────────────────────────────────────────────────────────────────────────

function PatientHome() {
  const navigate = useNavigate();
  return (
    <div className="px-4 py-4 space-y-4">
      {/* Hero card */}
      <div className="rounded-2xl p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", minHeight: 130 }}>
        <div className="relative z-10">
          <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.7)" }}>Next appointment</p>
          <p className="text-lg font-bold text-white mt-1">Dr. L. Ferreira</p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.75)" }}>General Practice · 10 Jul, 10:00 AM</p>
          <button className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg" style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>View details →</button>
        </div>
        <div className="absolute right-4 bottom-4 opacity-10">
          <Heart size={80} color="#fff" />
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Quick Actions</h3>
        <div className="grid grid-cols-4 gap-2">
          {[{ icon: Calendar, label: "Book Appt", path: "book" }, { icon: FlaskConical, label: "My Labs", path: "labs" }, { icon: Pill, label: "Prescriptions", path: "prescriptions" }, { icon: FileText, label: "Records", path: "appointments" }].map(({ icon: Icon, label, path }) => (
            <button key={label} onClick={() => navigate(`/patient/${path}`)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
              style={{ background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "#E6F7F6" }}>
                <Icon size={16} style={{ color: "#0F7D7A" }} />
              </div>
              <span className="text-[10px] font-medium text-foreground text-center leading-tight">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Health reminders */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Health Reminders</h3>
        <div className="space-y-2">
          {[
            { icon: Pill, title: "Take Metformin 500mg", sub: "With breakfast — 8:00 AM", color: "#0F7D7A" },
            { icon: Activity, title: "Blood glucose check", sub: "Fasting — before breakfast", color: "#F59E0B" },
            { icon: Stethoscope, title: "ANC Visit", sub: "10 July at Microhealth Lekki", color: "#8B5CF6" },
          ].map(({ icon: Icon, title, sub, color }) => (
            <div key={title} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "18" }}>
                <Icon size={15} style={{ color }} />
              </div>
              <div><p className="text-sm font-medium text-foreground">{title}</p><p className="text-xs text-muted-foreground">{sub}</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Nearest unit */}
      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)", boxShadow: CARD_SHADOW }}>
        <div className="h-24 w-full" style={{ background: "linear-gradient(135deg, #E6F7F6, #B2E8E6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <MapPin size={32} style={{ color: "#0F7D7A", opacity: 0.5 }} />
        </div>
        <div className="p-3 bg-white">
          <p className="text-sm font-semibold text-foreground">MicroHealth Lekki</p>
          <p className="text-xs text-muted-foreground mt-0.5">14 Adeola Hopewell St · 1.2km away</p>
          <div className="flex gap-2 mt-2">
            <button className="flex-1 py-1.5 text-xs font-medium rounded-lg text-white" style={{ background: "#0F7D7A" }}>Get Directions</button>
            <button className="flex-1 py-1.5 text-xs font-medium rounded-lg border" style={{ color: "#0F7D7A", borderColor: "rgba(15,125,122,0.2)" }}>Call</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BOOK APPOINTMENT (MULTI-STEP)
// ─────────────────────────────────────────────────────────────────────────────

function BookAppointment() {
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState({ service: "", unit: "", date: "", time: "" });
  const navigate = useNavigate();

  const steps = ["Service", "Unit", "Date & Time", "Confirm"];
  return (
    <div className="px-4 py-4">
      {/* Stepper */}
      <div className="flex items-center mb-6">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                style={{ background: i + 1 < step ? "#0F7D7A" : i + 1 === step ? "#0F7D7A" : "#E5E7EB", color: i + 1 <= step ? "#fff" : "#9CA3AF" }}>
                {i + 1 < step ? <CheckCircle size={12} /> : i + 1}
              </div>
              <span className="text-[9px] text-muted-foreground whitespace-nowrap">{s}</span>
            </div>
            {i < steps.length - 1 && <div className="flex-1 h-px mx-1 mb-4" style={{ background: i + 1 < step ? "#0F7D7A" : "#E5E7EB" }} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground">Select Service</h3>
          {["General Practice", "Antenatal Care", "Lab Tests", "Cardiology", "Dental"].map(s => (
            <button key={s} onClick={() => setSelected(p => ({ ...p, service: s }))}
              className="w-full flex items-center justify-between p-4 rounded-xl text-left transition-all"
              style={{ border: selected.service === s ? "2px solid #0F7D7A" : "1px solid rgba(0,0,0,0.08)", background: selected.service === s ? "#E6F7F6" : "#F8F9FA" }}>
              <span className="text-sm font-medium text-foreground">{s}</span>
              {selected.service === s && <CheckCircle size={16} style={{ color: "#0F7D7A" }} />}
            </button>
          ))}
        </div>
      )}

      {step === 2 && (
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground">Select Unit</h3>
          {["MicroHealth Lekki (1.2km)", "MicroHealth Victoria Island (3.4km)", "MicroHealth Ikeja (8.1km)"].map(u => (
            <button key={u} onClick={() => setSelected(p => ({ ...p, unit: u }))}
              className="w-full flex items-center justify-between p-4 rounded-xl text-left transition-all"
              style={{ border: selected.unit === u ? "2px solid #0F7D7A" : "1px solid rgba(0,0,0,0.08)", background: selected.unit === u ? "#E6F7F6" : "#F8F9FA" }}>
              <div><p className="text-sm font-medium text-foreground">{u.split(" (")[0]}</p><p className="text-xs text-muted-foreground">{u.split(" (")[1]?.replace(")", "")}</p></div>
              {selected.unit === u && <CheckCircle size={16} style={{ color: "#0F7D7A" }} />}
            </button>
          ))}
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">Select Date & Time</h3>
          <div className="grid grid-cols-3 gap-2">
            {["Mon 7", "Tue 8", "Wed 9", "Thu 10", "Fri 11", "Sat 12"].map(d => (
              <button key={d} onClick={() => setSelected(p => ({ ...p, date: d }))}
                className="py-3 rounded-xl text-sm font-medium transition-all"
                style={{ background: selected.date === d ? "#0F7D7A" : "#F3F4F6", color: selected.date === d ? "#fff" : "#374151", border: selected.date === d ? "none" : "1px solid rgba(0,0,0,0.08)" }}>
                {d}
              </button>
            ))}
          </div>
          <h4 className="text-sm font-semibold text-foreground">Available Slots</h4>
          <div className="grid grid-cols-3 gap-2">
            {["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM", "04:00 PM"].map(t => (
              <button key={t} onClick={() => setSelected(p => ({ ...p, time: t }))}
                className="py-2 rounded-xl text-xs font-medium transition-all"
                style={{ background: selected.time === t ? "#0F7D7A" : "#F3F4F6", color: selected.time === t ? "#fff" : "#374151", border: selected.time === t ? "none" : "1px solid rgba(0,0,0,0.08)" }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <h3 className="text-base font-semibold text-foreground">Confirm Booking</h3>
          <div className="rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(15,125,122,0.2)", background: "#E6F7F6" }}>
            <div className="p-4" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
              <p className="text-white font-semibold">{selected.service || "General Practice"}</p>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>{selected.unit?.split(" (")[0] || "MicroHealth Lekki"}</p>
            </div>
            <div className="p-4 space-y-3">
              {[["Date", selected.date || "Tue 8 Jul"], ["Time", selected.time || "10:00 AM"], ["Patient", "Yuki Tanaka"], ["Reference", "APT-0401"]].map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{k}</span>
                  <span className="font-medium text-foreground">{v}</span>
                </div>
              ))}
            </div>
          </div>
          <button className="w-full py-3.5 rounded-2xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg, #0F7D7A 0%, #0A5E5C 100%)", boxShadow: BTN_SHADOW }}
            onClick={() => navigate("/patient/appointments")}>
            Confirm Booking
          </button>
        </div>
      )}

      <div className="flex gap-3 mt-6">
        {step > 1 && <button className="flex-1 py-3 rounded-xl text-sm font-medium border" style={{ color: "#6B7280", borderColor: "rgba(0,0,0,0.1)" }} onClick={() => setStep(s => s - 1)}>← Back</button>}
        {step < 4 && <button className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #0F7D7A 0%, #0A5E5C 100%)", boxShadow: BTN_SHADOW }}
          onClick={() => setStep(s => s + 1)}>Continue →</button>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT APPOINTMENTS LIST
// ─────────────────────────────────────────────────────────────────────────────

function PatientAppointments() {
  const [tab, setTab] = useState("upcoming");
  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-base font-bold text-foreground">My Appointments</h2>
      <div className="flex gap-1 p-1 rounded-xl bg-muted">
        {["upcoming", "past"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all"
            style={{ background: tab === t ? "#fff" : "transparent", color: tab === t ? "#0F7D7A" : "#6B7280", boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {tab === "upcoming" ? (
          [{ doctor: "Dr. L. Ferreira", dept: "General Practice", date: "10 Jul 2026", time: "10:00 AM", ref: "APT-0393" },
           { doctor: "Dr. R. Nair", dept: "Oncology", date: "22 Jul 2026", time: "02:00 PM", ref: "APT-0412" }].map((a, i) => (
            <div key={i} className="p-4 rounded-xl" style={{ background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between mb-2">
                <StatusPill status="confirmed" />
                <span className="text-xs text-muted-foreground">{a.ref}</span>
              </div>
              <p className="text-sm font-semibold text-foreground">{a.doctor}</p>
              <p className="text-xs text-muted-foreground">{a.dept}</p>
              <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar size={11} />{a.date}</span>
                <span className="flex items-center gap-1"><Clock size={11} />{a.time}</span>
              </div>
            </div>
          ))
        ) : (
          [{ doctor: "Dr. L. Ferreira", dept: "General Practice", date: "1 Jul 2026" },
           { doctor: "Dr. L. Ferreira", dept: "ANC Visit", date: "15 Jun 2026" }].map((a, i) => (
            <div key={i} className="p-4 rounded-xl" style={{ background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.06)" }}>
              <StatusPill status="completed" />
              <p className="text-sm font-semibold text-foreground mt-2">{a.doctor}</p>
              <p className="text-xs text-muted-foreground">{a.dept}</p>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground"><Calendar size={11} />{a.date}</div>
              <button className="mt-2 text-xs font-medium" style={{ color: "#0F7D7A" }}>View Summary →</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT VITALS
// ─────────────────────────────────────────────────────────────────────────────

function PatientVitals() {
  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">My Health</h2>
        <button className="text-xs font-medium" style={{ color: "#0F7D7A" }}>View trends</button>
      </div>
      <div className="rounded-2xl p-4" style={{ background: "linear-gradient(135deg, #ECFDF5, #D1FAE5)", border: "1px solid rgba(16,185,129,0.15)" }}>
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle size={16} style={{ color: "#10B981" }} />
          <span className="text-sm font-semibold" style={{ color: "#065F46" }}>All Good</span>
        </div>
        <p className="text-xs" style={{ color: "#6B7280" }}>Your recent vitals are within normal range.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[{ label: "Blood Sugar", value: "5.8 mmol/L", ref: "Normal (3.9–6.1)", icon: Activity, ok: true },
          { label: "Blood Pressure", value: "118/76 mmHg", ref: "Normal (< 120/80)", icon: Heart, ok: true },
          { label: "Weight", value: "68 kg", ref: "BMI: 24.1 — Normal", icon: TU, ok: true },
          { label: "Temperature", value: "36.8°C", ref: "Normal (36.1–37.2)", icon: Thermometer, ok: true },
        ].map(({ label, value, ref, icon: Icon, ok }) => (
          <div key={label} className="p-4 rounded-xl" style={{ background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ background: "#E6F7F6" }}>
              <Icon size={14} style={{ color: "#0F7D7A" }} />
            </div>
            <p className="text-sm font-bold text-foreground">{value}</p>
            <p className="text-xs font-medium text-foreground mt-0.5">{label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{ref}</p>
          </div>
        ))}
      </div>
      <h3 className="text-sm font-semibold text-foreground">Recent Readings</h3>
      {[{ date: "3 Jul", bp: "118/76", bs: "5.8 mmol/L", note: "Normal" }, { date: "1 Jul", bp: "122/80", bs: "6.1 mmol/L", note: "Normal" }, { date: "28 Jun", bp: "119/78", bs: "5.6 mmol/L", note: "Normal" }].map((r, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#E6F7F6" }}><span className="text-[10px] font-bold" style={{ color: "#0F7D7A" }}>{r.date.split(" ")[0]}</span></div>
          <div className="flex-1"><p className="text-xs font-medium text-foreground">{r.date} — BP: {r.bp} · BS: {r.bs}</p></div>
          <StatusPill status="active" />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT PRESCRIPTIONS
// ─────────────────────────────────────────────────────────────────────────────

function PatientPrescriptions() {
  const [tab, setTab] = useState("active");
  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-base font-bold text-foreground">Prescriptions</h2>
      <div className="flex gap-1 p-1 rounded-xl bg-muted">
        {["active", "past"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="flex-1 py-2 text-sm font-medium rounded-lg capitalize transition-all"
            style={{ background: tab === t ? "#fff" : "transparent", color: tab === t ? "#0F7D7A" : "#6B7280", boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none" }}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>
      <div className="space-y-3">
        {(tab === "active" ? [
          { med: "Metformin 500mg", dose: "Twice daily with meals", refills: 2, exp: "30 Sep 2026" },
          { med: "Folic Acid 5mg", dose: "Once daily", refills: 3, exp: "30 Sep 2026" },
        ] : [
          { med: "Amoxicillin 500mg", dose: "3× daily for 7 days", refills: 0, exp: "Expired" },
        ]).map((rx, i) => (
          <div key={i} className="p-4 rounded-xl" style={{ background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.06)" }}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">{rx.med}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{rx.dose}</p>
              </div>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "#E6F7F6" }}>
                <Pill size={16} style={{ color: "#0F7D7A" }} />
              </div>
            </div>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">Expires: {rx.exp}</span>
              {tab === "active" && rx.refills > 0 && (
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: "#0F7D7A" }}>Request Refill ({rx.refills})</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT LAB RESULTS
// ─────────────────────────────────────────────────────────────────────────────

function PatientLabs() {
  const [open, setOpen] = useState<number | null>(0);
  const labs = [
    { test: "HbA1c + Fasting Glucose", date: "3 Jul 2026", status: "normal", result: "HbA1c: 5.4% (Ref: < 5.7%) · FG: 5.8 mmol/L (Ref: 3.9–6.1)", note: "Values within normal range. Continue current management." },
    { test: "Full Blood Count", date: "15 Jun 2026", status: "normal", result: "Hb: 12.8 g/dL · WBC: 7.2 × 10⁹/L · PLT: 242 × 10⁹/L", note: "All indices within reference range." },
    { test: "Urine Dipstick", date: "1 Jun 2026", status: "pending", result: "—", note: "Results pending review by Dr. Ferreira." },
  ];
  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Lab Results</h2>
        <button className="flex items-center gap-1 text-xs font-medium" style={{ color: "#0F7D7A" }}><Download size={12} />Download All</button>
      </div>
      <div className="space-y-2">
        {labs.map((l, i) => (
          <div key={i} className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(0,0,0,0.06)" }}>
            <button className="w-full flex items-center justify-between p-4 text-left" style={{ background: open === i ? "#F0FAFA" : "#F8F9FA" }} onClick={() => setOpen(open === i ? null : i)}>
              <div>
                <p className="text-sm font-semibold text-foreground">{l.test}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">{l.date}</span>
                  <StatusPill status={l.status === "pending" ? "pending" : "active"} />
                </div>
              </div>
              <ChevronDown size={16} className={`text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && (
              <div className="px-4 pb-4" style={{ background: "#F0FAFA" }}>
                <div className="pt-3" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                  <p className="text-xs font-medium text-foreground">Result: <span className="font-normal text-muted-foreground">{l.result}</span></p>
                  <p className="text-xs font-medium text-foreground mt-2">Clinician note: <span className="font-normal text-muted-foreground">{l.note}</span></p>
                  {l.status !== "pending" && <button className="flex items-center gap-1 mt-3 text-xs font-medium" style={{ color: "#0F7D7A" }}><Download size={11} />Download PDF</button>}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// FAMILY MEMBERS
// ─────────────────────────────────────────────────────────────────────────────

function FamilyMembers() {
  return (
    <div className="px-4 py-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Family Members</h2>
        <button className="flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg text-white" style={{ background: "#0F7D7A" }}><Plus size={12} />Add</button>
      </div>
      {[{ name: "Kenji Tanaka", relation: "Spouse", age: 32, status: "active" },
        { name: "Hana Tanaka", relation: "Daughter", age: 4, status: "active" }].map((m, i) => (
        <div key={i} className="p-4 rounded-xl" style={{ background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.06)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: "#E6F7F6", color: "#0F7D7A" }}>{m.name.split(" ").map(n => n[0]).join("")}</div>
            <div><p className="text-sm font-semibold text-foreground">{m.name}</p><p className="text-xs text-muted-foreground">{m.relation} · {m.age}y</p></div>
            <StatusPill status={m.status} />
          </div>
          <div className="flex gap-2">
            <button className="flex-1 py-2 text-xs font-medium rounded-lg" style={{ background: "#E6F7F6", color: "#0F7D7A" }}>View Record</button>
            <button className="flex-1 py-2 text-xs font-medium rounded-lg" style={{ background: "#F3F4F6", color: "#374151" }}>Book Visit</button>
            <button className="flex-1 py-2 text-xs font-medium rounded-lg" style={{ background: "#F3F4F6", color: "#374151" }}>Vitals</button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT MESSAGES
// ─────────────────────────────────────────────────────────────────────────────

function PatientMessages() {
  return (
    <div className="px-4 py-4 space-y-4">
      <h2 className="text-base font-bold text-foreground">Messages & Reminders</h2>
      <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "#E6F7F6", border: "1px solid rgba(15,125,122,0.15)" }}>
        <Bell size={16} style={{ color: "#0F7D7A", marginTop: 2 }} />
        <div>
          <p className="text-sm font-semibold" style={{ color: "#0A5E5C" }}>Enable Push Notifications</p>
          <p className="text-xs mt-0.5" style={{ color: "#36A09D" }}>Get reminders for medications and appointments.</p>
          <button className="mt-2 text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: "#0F7D7A" }}>Enable</button>
        </div>
      </div>
      <div className="space-y-2">
        {[{ icon: Pill, title: "Medication Reminder", msg: "Take Metformin 500mg with breakfast.", time: "8:00 AM Today", unread: true, color: "#0F7D7A" },
          { icon: Calendar, title: "Appointment Confirmed", msg: "Your visit with Dr. Ferreira on 10 Jul is confirmed.", time: "Yesterday", unread: true, color: "#3B82F6" },
          { icon: FlaskConical, title: "Lab Result Ready", msg: "Your HbA1c results are now available.", time: "3 Jul", unread: false, color: "#10B981" },
          { icon: Heart, title: "Health Tip", msg: "Staying hydrated helps manage blood sugar. Aim for 8 glasses daily.", time: "2 Jul", unread: false, color: "#F59E0B" },
        ].map((n, i) => (
          <div key={i} className="flex items-start gap-3 p-4 rounded-xl transition-all cursor-pointer"
            style={{ background: n.unread ? "#F8FFFF" : "#F8F9FA", border: n.unread ? "1px solid rgba(15,125,122,0.12)" : "1px solid rgba(0,0,0,0.06)" }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: n.color + "18" }}>
              <n.icon size={15} style={{ color: n.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2"><p className="text-sm font-semibold text-foreground">{n.title}</p><span className="text-[10px] text-muted-foreground flex-shrink-0">{n.time}</span></div>
              <p className="text-xs text-muted-foreground mt-0.5">{n.msg}</p>
            </div>
            {n.unread && <span className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ background: "#0F7D7A" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PATIENT PROFILE & SETTINGS
// ─────────────────────────────────────────────────────────────────────────────

function PatientProfilePage() {
  const navigate = useNavigate();
  return (
    <div className="px-4 py-4 space-y-4">
      {/* Profile card */}
      <div className="rounded-2xl p-5 text-center" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-3" style={{ background: "rgba(255,255,255,0.15)" }}>YT</div>
        <p className="text-lg font-bold text-white">Yuki Tanaka</p>
        <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.7)" }}>PAT-003 · B+ Blood Group</p>
      </div>

      {/* Settings sections */}
      {[{ title: "Payment & Billing", items: [{ icon: DollarSign, label: "Payment Methods" }, { icon: FileText, label: "Billing History" }] },
        { title: "Notifications", items: [{ icon: Bell, label: "Notification Preferences" }, { icon: MessageSquare, label: "SMS / WhatsApp Alerts" }] },
        { title: "Privacy & Security", items: [{ icon: Lock, label: "Change Password" }, { icon: Shield, label: "Privacy Settings" }] },
      ].map(({ title, items }) => (
        <div key={title} className="rounded-xl overflow-hidden" style={{ background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.06)" }}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 pt-3 pb-1">{title}</p>
          {items.map(({ icon: Icon, label }, j) => (
            <button key={label} className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted"
              style={{ borderTop: j > 0 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "#E6F7F6" }}>
                <Icon size={14} style={{ color: "#0F7D7A" }} />
              </div>
              <span className="flex-1 text-sm font-medium text-foreground">{label}</span>
              <ChevronRight size={14} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      ))}

      <button className="w-full py-3 rounded-xl text-sm font-semibold border transition-all" style={{ color: "#EF4444", borderColor: "rgba(239,68,68,0.2)", background: "#FEF2F2" }}
        onClick={() => navigate("/patient/login")}>
        Sign Out
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SYSTEM PAGES
// ─────────────────────────────────────────────────────────────────────────────

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"email" | "sent" | "reset">("email");
  return (
    <div className="flex items-center justify-center min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="w-full max-w-sm mx-4">
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
            <Heart size={20} color="#fff" />
          </div>
          <span className="text-xl font-bold text-foreground">MicroHealth</span>
        </div>
        <div className="bg-card rounded-2xl p-6" style={{ boxShadow: CARD_SHADOW }}>
          {step === "email" && (<>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#E6F7F6" }}><KeyRound size={20} style={{ color: "#0F7D7A" }} /></div>
            <h2 className="text-xl font-bold text-foreground mb-1">Reset Password</h2>
            <p className="text-sm text-muted-foreground mb-6">Enter your work email to receive a reset link.</p>
            <input className="w-full px-4 py-2.5 text-sm rounded-lg outline-none mb-4"
              style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }}
              placeholder="dr.name@microhealth.ng" />
            <button className="w-full py-3 rounded-lg text-sm font-semibold text-white mb-3"
              style={{ background: "linear-gradient(135deg, #0F7D7A 0%, #0A5E5C 100%)", boxShadow: BTN_SHADOW }}
              onClick={() => setStep("sent")}>Send Reset Link</button>
            <button className="w-full text-sm text-center text-muted-foreground" onClick={() => navigate("/login")}>← Back to sign in</button>
          </>)}
          {step === "sent" && (<>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ background: "#ECFDF5" }}><CheckCircle size={20} style={{ color: "#10B981" }} /></div>
            <h2 className="text-xl font-bold text-foreground mb-1">Check your email</h2>
            <p className="text-sm text-muted-foreground mb-6">A reset link was sent to <strong>dr.okonkwo@microhealth.ng</strong>. It expires in 15 minutes.</p>
            <button className="w-full py-3 rounded-lg text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #0F7D7A 0%, #0A5E5C 100%)", boxShadow: BTN_SHADOW }}
              onClick={() => setStep("reset")}>I have the link →</button>
          </>)}
          {step === "reset" && (<>
            <h2 className="text-xl font-bold text-foreground mb-1">Set New Password</h2>
            <p className="text-sm text-muted-foreground mb-6">Must be at least 8 characters.</p>
            <div className="space-y-3 mb-4">
              <input className="w-full px-4 py-2.5 text-sm rounded-lg outline-none" placeholder="New password"
                style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }} type="password" />
              <input className="w-full px-4 py-2.5 text-sm rounded-lg outline-none" placeholder="Confirm password"
                style={{ background: "#F3F4F6", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }} type="password" />
            </div>
            <button className="w-full py-3 rounded-lg text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #0F7D7A 0%, #0A5E5C 100%)", boxShadow: BTN_SHADOW }}
              onClick={() => navigate("/login")}>Update Password</button>
          </>)}
        </div>
      </div>
    </div>
  );
}

function UnauthorizedPage() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="text-center max-w-sm mx-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "#FEF2F2" }}>
          <Shield size={28} style={{ color: "#EF4444" }} />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
        <p className="text-sm text-muted-foreground mb-6">You do not have permission to view this page. Contact your administrator if you believe this is an error.</p>
        <div className="flex gap-3 justify-center">
          <button className="px-4 py-2.5 text-sm font-medium rounded-lg border" style={{ color: "#374151", borderColor: "rgba(0,0,0,0.1)" }} onClick={() => navigate(-1 as never)}>← Go Back</button>
          <button className="px-4 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }} onClick={() => navigate("/login")}>Sign In</button>
        </div>
      </div>
    </div>
  );
}

function NotFoundPage() {
  const navigate = useNavigate();
  return (
    <div className="flex items-center justify-center min-h-screen bg-background" style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="text-center max-w-sm mx-4">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: "#E6F7F6" }}>
          <Info size={28} style={{ color: "#0F7D7A" }} />
        </div>
        <h1 className="text-5xl font-bold text-foreground mb-3" style={{ color: "#0F7D7A" }}>404</h1>
        <p className="text-base font-semibold text-foreground mb-2">Page not found</p>
        <p className="text-sm text-muted-foreground mb-6">The page you are looking for does not exist or may have been moved.</p>
        <button className="px-6 py-2.5 text-sm font-semibold text-white rounded-lg" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: BTN_SHADOW }} onClick={() => navigate("/login")}>Back to Home</button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LANDING PAGE
// ─────────────────────────────────────────────────────────────────────────────

const IMGS = {
  hero:       "https://images.unsplash.com/photo-1758691461935-202e2ef6b69f?w=1400&h=900&fit=crop&auto=format",
  heroAlt:    "https://images.unsplash.com/photo-1758691462878-6edc3d3da1be?w=900&h=1100&fit=crop&auto=format",
  surgical:   "https://images.unsplash.com/photo-1504439468489-c8920d796a29?w=700&h=480&fit=crop&auto=format",
  docLaptop:  "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=700&h=480&fit=crop&auto=format",
  clinic:     "https://images.unsplash.com/photo-1762625570087-6d98fca29531?w=700&h=480&fit=crop&auto=format",
  corridor:   "https://images.unsplash.com/photo-1777269749032-d8d458ae594d?w=900&h=600&fit=crop&auto=format",
  equipment:  "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=700&h=480&fit=crop&auto=format",
  doc1:       "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop&auto=format",
  doc2:       "https://images.unsplash.com/photo-1673865641073-4479f93a7776?w=200&h=200&fit=crop&auto=format",
  doc3:       "https://images.unsplash.com/photo-1659353888906-adb3e0041693?w=200&h=200&fit=crop&auto=format",
};

function LandingPage() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  if (typeof window !== "undefined") {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{ background: scrolled ? "rgba(255,255,255,0.95)" : "transparent", backdropFilter: scrolled ? "blur(12px)" : "none", borderBottom: scrolled ? "1px solid rgba(0,0,0,0.07)" : "none" }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
              <Heart size={16} color="#fff" />
            </div>
            <span className="text-lg font-bold text-white" style={{ color: scrolled ? "#0D1B2A" : "#fff" }}>MicroHealth</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            {["Platform", "For Patients", "For Facilities", "Pricing"].map(item => (
              <a key={item} href="#" className="text-sm font-medium transition-colors"
                style={{ color: scrolled ? "#4B5563" : "rgba(255,255,255,0.85)" }}
                onMouseEnter={e => (e.currentTarget.style.color = scrolled ? "#0F7D7A" : "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = scrolled ? "#4B5563" : "rgba(255,255,255,0.85)")}>
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button className="hidden md:block text-sm font-medium px-4 py-2 rounded-lg transition-all"
              style={{ color: scrolled ? "#0F7D7A" : "#fff", background: scrolled ? "#E6F7F6" : "rgba(255,255,255,0.12)" }}
              onClick={() => navigate("/login")}>Staff Login</button>
            <button className="text-sm font-semibold px-4 py-2 rounded-lg transition-all text-white"
              style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 4px 6px -1px rgba(15,125,122,0.35)" }}
              onClick={() => navigate("/patient/login")}>Patient Portal</button>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center overflow-hidden" style={{ background: "#0D1520" }}>
        {/* Background image */}
        <div className="absolute inset-0">
          <img src={IMGS.hero} alt="Doctor consulting with patient" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0" style={{ background: "linear-gradient(105deg, rgba(13,21,32,0.97) 0%, rgba(13,21,32,0.8) 45%, rgba(13,21,32,0.3) 100%)" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 w-full pt-24 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
                style={{ background: "rgba(15,125,122,0.2)", color: "#36A09D", border: "1px solid rgba(15,125,122,0.3)" }}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#36A09D] animate-pulse" />
                Now live across 200+ facilities in Nigeria
              </div>
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-6"
                style={{ letterSpacing: "-0.02em" }}>
                The operating<br />system for<br />
                <span style={{ background: "linear-gradient(90deg, #36A09D, #4CAF50)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                  modern healthcare.
                </span>
              </h1>
              <p className="text-lg leading-relaxed mb-8" style={{ color: "rgba(255,255,255,0.65)", maxWidth: 480 }}>
                From patient intake to discharge — manage records, appointments, vitals, pharmacy, revenue, and your entire clinical team. One platform. Zero chaos.
              </p>
              <div className="flex items-center gap-4 flex-wrap">
                <button className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold text-white transition-all"
                  style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 8px 20px rgba(15,125,122,0.4)" }}
                  onClick={() => navigate("/login")}>
                  Start Free Trial
                  <ArrowRight size={16} />
                </button>
                <button className="flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold transition-all"
                  style={{ color: "#fff", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
                  onClick={() => navigate("/admin/dashboard")}>
                  View Live Demo
                </button>
              </div>

              {/* Stat strip */}
              <div className="flex items-center gap-6 mt-12 flex-wrap">
                {[{ n: "200+", l: "Facilities" }, { n: "1.2M+", l: "Patient records" }, { n: "99.9%", l: "Uptime SLA" }, { n: "< 2min", l: "Avg onboard" }].map(({ n, l }) => (
                  <div key={l}>
                    <div className="text-2xl font-bold text-white">{n}</div>
                    <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — stacked image cards */}
            <div className="hidden lg:block relative h-[560px]">
              {/* Main tall image */}
              <div className="absolute right-0 top-0 w-72 h-96 rounded-3xl overflow-hidden"
                style={{ boxShadow: "0 40px 80px rgba(0,0,0,0.6)" }}>
                <img src={IMGS.heroAlt} alt="Doctor with patient" className="w-full h-full object-cover" />
                {/* Floating metric badge */}
                <div className="absolute bottom-4 left-4 right-4 rounded-2xl p-3"
                  style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: "#E6F7F6" }}>
                      <Activity size={12} style={{ color: "#0F7D7A" }} />
                    </div>
                    <span className="text-xs font-semibold text-foreground">Today's Overview</span>
                  </div>
                  <div className="flex gap-4">
                    {[{ v: "38", l: "Appointments" }, { v: "6", l: "Critical" }, { v: "94%", l: "Recovery" }].map(({ v, l }) => (
                      <div key={l}><div className="text-sm font-bold text-foreground">{v}</div><div className="text-[10px] text-muted-foreground">{l}</div></div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Secondary card — behind and offset */}
              <div className="absolute left-0 bottom-8 w-60 h-52 rounded-3xl overflow-hidden"
                style={{ boxShadow: "0 24px 48px rgba(0,0,0,0.5)" }}>
                <img src={IMGS.equipment} alt="Medical equipment" className="w-full h-full object-cover" />
                <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(10,94,92,0.85) 0%, transparent 60%)" }} />
                <div className="absolute bottom-3 left-4">
                  <p className="text-xs font-semibold text-white">Lab & Diagnostics</p>
                  <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.7)" }}>24 tests tracked today</p>
                </div>
              </div>
              {/* Floating alert pill */}
              <div className="absolute left-16 top-8 flex items-center gap-2 px-3 py-2 rounded-full"
                style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-foreground">All systems operational</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade to white */}
        <div className="absolute bottom-0 left-0 right-0 h-32" style={{ background: "linear-gradient(to bottom, transparent, #fff)" }} />
      </section>

      {/* ── TRUST STRIP ── */}
      <section className="bg-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-xs font-semibold tracking-widest uppercase text-muted-foreground mb-8">Trusted by leading healthcare providers across Nigeria</p>
          <div className="flex items-center justify-center gap-8 flex-wrap">
            {["Lagos University Teaching Hospital", "National Orthopaedic Hospital", "Island Cardiology Specialists", "Central Lab & Diagnostics", "EKO Hospital Complex", "Reddington Hospital"].map(name => (
              <div key={name} className="flex items-center gap-2 px-4 py-2 rounded-lg"
                style={{ background: "#F8F9FA", border: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" style={{ background: "#E6F7F6" }}>
                  <Building2 size={10} style={{ color: "#0F7D7A" }} />
                </div>
                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-24 px-6" style={{ background: "#F8F9FA" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{ background: "#E6F7F6", color: "#0F7D7A" }}>Platform Features</div>
            <h2 className="text-4xl font-bold text-foreground mb-4" style={{ letterSpacing: "-0.02em" }}>
              Everything your facility needs.<br />Nothing it does not.
            </h2>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              Built for the pace of clinical work — not an office. Fast, reliable, and designed to disappear so your team can focus on care.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { img: IMGS.docLaptop, title: "Unified Clinical Records", body: "Every patient encounter, vital, prescription, lab result, and note — linked, searchable, and accessible at the point of care.", tag: "Records & EMR", color: "#0F7D7A", alt: "Doctor using laptop" },
              { img: IMGS.surgical, title: "Real-Time Ward Management", body: "Live occupancy tracking, critical-alert escalations, and shift handover tools. Know the status of every bed, at every moment.", tag: "Operations", color: "#36A09D", alt: "Surgical team in OR" },
              { img: IMGS.clinic, title: "Patient-First Engagement", body: "A polished mobile portal for booking, results, prescriptions, and reminders. Reduce no-shows. Improve adherence. Build loyalty.", tag: "Patient Portal", color: "#4CAF50", alt: "Modern clinic" },
            ].map(({ img, title, body, tag, color, alt }) => (
              <div key={title} className="bg-white rounded-3xl overflow-hidden transition-all"
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.10)" }}>
                <div className="relative h-52 overflow-hidden bg-muted">
                  <img src={img} alt={alt} className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.35))" }} />
                  <span className="absolute bottom-3 left-4 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(255,255,255,0.92)", color }}>
                    {tag}
                  </span>
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
                  <button className="flex items-center gap-1.5 text-sm font-semibold mt-4 transition-colors" style={{ color }}>
                    Learn more <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SPLIT FEATURE: CLINICAL WORKFLOW ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Image */}
          <div className="relative rounded-3xl overflow-hidden h-[520px] bg-muted"
            style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.10)" }}>
            <img src={IMGS.corridor} alt="Hospital corridor" className="w-full h-full object-cover" />
            {/* Overlay stat card */}
            <div className="absolute bottom-6 left-6 right-6 rounded-2xl p-4"
              style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-foreground">Ward Bed Utilisation</span>
                <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: "#E6F7F6", color: "#0F7D7A" }}>Live</span>
              </div>
              <div className="space-y-2">
                {[{ ward: "Cardiology", pct: 85, color: "#0F7D7A" }, { ward: "ICU", pct: 90, color: "#EF4444" }, { ward: "Paediatric", pct: 68, color: "#36A09D" }].map(({ ward, pct, color }) => (
                  <div key={ward}>
                    <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{ward}</span><span className="font-medium text-foreground">{pct}%</span></div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Copy */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{ background: "#E6F7F6", color: "#0F7D7A" }}>For Staff & Administrators</div>
            <h2 className="text-4xl font-bold text-foreground mb-5" style={{ letterSpacing: "-0.02em" }}>
              A command centre<br />for every department.
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed mb-8">
              The admin dashboard gives department heads, nurses, and physicians a single, shared view of patient flow, resource utilisation, and financial performance — in real time.
            </p>
            <div className="space-y-4">
              {[
                { icon: Activity, title: "Real-time vitals alerts", desc: "Critical readings surface immediately. No manual escalation required." },
                { icon: BarChart3, title: "Revenue & billing analytics", desc: "Track daily revenue, insurance claims, and outstanding payments from one screen." },
                { icon: ClipboardList, title: "Pharmacy & inventory control", desc: "Monitor stock levels, auto-flag low items, and log dispensations." },
                { icon: Users, title: "Staff scheduling & tracking", desc: "See who is on duty, how many patients they are managing, and shift coverage gaps." },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background: "#E6F7F6" }}>
                    <Icon size={16} style={{ color: "#0F7D7A" }} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="flex items-center gap-2 mt-10 px-6 py-3 rounded-xl text-sm font-semibold text-white"
              style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: BTN_SHADOW }}
              onClick={() => navigate("/admin/dashboard")}>
              Explore the Dashboard <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </section>

      {/* ── STATS BANNER ── */}
      <section className="py-20 px-6" style={{ background: "#131E33" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { n: "200+", l: "Facilities active", sub: "Across 12 states" },
              { n: "1.2M", l: "Patient records", sub: "Securely stored" },
              { n: "₦4.8B", l: "Revenue tracked", sub: "Monthly across the network" },
              { n: "99.9%", l: "Platform uptime", sub: "12-month rolling average" },
            ].map(({ n, l, sub }) => (
              <div key={l} className="text-center">
                <div className="text-4xl font-bold mb-2" style={{ color: "#36A09D" }}>{n}</div>
                <div className="text-base font-semibold text-white">{l}</div>
                <div className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{ background: "#E6F7F6", color: "#0F7D7A" }}>Onboarding</div>
            <h2 className="text-4xl font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>Live in under 48 hours.</h2>
            <p className="text-base text-muted-foreground mt-3 max-w-lg mx-auto">No long implementations. No expensive consultants. Your team is operational before the week is out.</p>
          </div>
          <div className="relative">
            <div className="absolute left-6 top-6 bottom-6 w-px hidden lg:block" style={{ background: "rgba(0,0,0,0.07)" }} />
            <div className="space-y-10">
              {[
                { step: "01", title: "Register your facility", desc: "Enter your facility name, units, and staff roles. We provision your account instantly — no paperwork, no waiting.", img: IMGS.clinic, alt: "Modern clinic interior" },
                { step: "02", title: "Migrate or start fresh", desc: "Import existing patient records via CSV, or start with a clean slate. Our team assists with structured data migration at no extra cost.", img: IMGS.equipment, alt: "Medical equipment" },
                { step: "03", title: "Train in one session", desc: "A 60-minute guided walkthrough covers everything your staff needs. Our design means most people are self-sufficient within minutes.", img: IMGS.docLaptop, alt: "Doctor with laptop" },
              ].map(({ step, title, desc, img, alt }, i) => (
                <div key={step} className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-center">
                  <div className="lg:col-span-3 flex gap-6">
                    <div className="flex flex-col items-center flex-shrink-0">
                      <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-bold text-white z-10"
                        style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>{step}</div>
                    </div>
                    <div className="pt-2">
                      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
                      <p className="text-base text-muted-foreground leading-relaxed">{desc}</p>
                    </div>
                  </div>
                  <div className="lg:col-span-2 h-44 rounded-2xl overflow-hidden bg-muted"
                    style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.08)" }}>
                    <img src={img} alt={alt} className="w-full h-full object-cover" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 px-6" style={{ background: "#F8F9FA" }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
              style={{ background: "#E6F7F6", color: "#0F7D7A" }}>From our users</div>
            <h2 className="text-4xl font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>
              Trusted by those who matter most.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { img: IMGS.doc1, name: "Dr. Taiwo Adeyemi", role: "Medical Director, EKO Hospital Complex", quote: "MicroHealth replaced four separate systems we were patching together. Bed management, billing, and referrals are all in one place now. Our admin overhead dropped by 40%." },
              { img: IMGS.doc2, name: "Dr. Amaka Okafor", role: "Chief of Staff, National Orthopaedic Hospital", quote: "The critical-alert feature alone has prevented two adverse events in the first month. Real-time vitals escalation is something we never had before at any price point." },
              { img: IMGS.doc3, name: "Dr. Fatima Al-Rashid", role: "Attending Physician, Island Cardiology Specialists", quote: "Patients love the mobile portal. Appointment reminders cut our no-show rate by 60%. I use the clinical notes on my phone between cases — it is genuinely elegant software." },
            ].map(({ img, name, role, quote }) => (
              <div key={name} className="bg-white rounded-3xl p-6 flex flex-col"
                style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.08)" }}>
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(s => <Star key={s} size={14} fill="#0F7D7A" style={{ color: "#0F7D7A" }} />)}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed flex-1 mb-6">&ldquo;{quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <img src={img} alt={name} className="w-11 h-11 rounded-full object-cover bg-muted flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLATFORM PREVIEW ── */}
      <section className="py-24 px-6 bg-white overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground" style={{ letterSpacing: "-0.02em" }}>The platform, at a glance.</h2>
            <p className="text-base text-muted-foreground mt-3">Both the staff dashboard and patient portal, side by side.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Admin preview */}
            <div className="rounded-3xl overflow-hidden" style={{ background: "#131E33", boxShadow: "0 32px 64px rgba(0,0,0,0.15)", minHeight: 380 }}>
              <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                <div className="flex gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /><span className="w-3 h-3 rounded-full bg-yellow-400" /><span className="w-3 h-3 rounded-full bg-green-500" /></div>
                <span className="text-xs text-center flex-1" style={{ color: "rgba(255,255,255,0.3)" }}>microhealth.ng/admin/dashboard</span>
              </div>
              <div className="flex h-[340px]">
                {/* Mini sidebar */}
                <div className="w-14 flex-shrink-0 flex flex-col items-center pt-4 gap-4" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                  {[LayoutDashboard, Users, Calendar, Activity, Pill].map((Icon, i) => (
                    <div key={i} className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: i === 0 ? "rgba(15,125,122,0.25)" : "transparent" }}>
                      <Icon size={14} style={{ color: i === 0 ? "#36A09D" : "rgba(255,255,255,0.3)" }} />
                    </div>
                  ))}
                </div>
                {/* Content */}
                <div className="flex-1 p-4 space-y-3">
                  <div className="grid grid-cols-4 gap-2">
                    {[{ l: "Patients", v: "1,284", c: "#0F7D7A" }, { l: "Appts", v: "38", c: "#36A09D" }, { l: "Critical", v: "6", c: "#EF4444" }, { l: "Recovery", v: "94%", c: "#4CAF50" }].map(({ l, v, c }) => (
                      <div key={l} className="rounded-xl p-2.5" style={{ background: "rgba(255,255,255,0.05)" }}>
                        <div className="text-sm font-bold" style={{ color: c }}>{v}</div>
                        <div className="text-[9px]" style={{ color: "rgba(255,255,255,0.4)" }}>{l}</div>
                      </div>
                    ))}
                  </div>
                  {/* Fake chart */}
                  <div className="rounded-xl p-3" style={{ background: "rgba(255,255,255,0.04)" }}>
                    <div className="text-[10px] mb-2 font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>Patient Flow — 2026</div>
                    <div className="flex items-end gap-1 h-16">
                      {[55,72,65,80,78,88,84].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm" style={{ height: `${h}%`, background: i === 6 ? "#0F7D7A" : "rgba(15,125,122,0.3)" }} />
                      ))}
                    </div>
                  </div>
                  {/* Fake table rows */}
                  <div className="space-y-1.5">
                    {[{ name: "Eleanor Vance", dept: "Cardiology", s: "#10B981" }, { name: "Marcus Bell", dept: "ICU", s: "#EF4444" }, { name: "Yuki Tanaka", dept: "General", s: "#3B82F6" }].map(({ name, dept, s }) => (
                      <div key={name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg" style={{ background: "rgba(255,255,255,0.04)" }}>
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-bold" style={{ background: "#E6F7F6", color: "#0F7D7A" }}>{name[0]}</div>
                        <span className="text-[10px] font-medium flex-1" style={{ color: "rgba(255,255,255,0.75)" }}>{name}</span>
                        <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>{dept}</span>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: s }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>Staff Dashboard · 1440px</span>
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: "#0F7D7A" }} onClick={() => navigate("/admin/dashboard")}>Open →</button>
              </div>
            </div>

            {/* Patient preview */}
            <div className="rounded-3xl overflow-hidden bg-white flex flex-col"
              style={{ boxShadow: "0 32px 64px rgba(0,0,0,0.10)", border: "1px solid rgba(0,0,0,0.07)" }}>
              <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
                <div className="flex gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400" /><span className="w-3 h-3 rounded-full bg-yellow-300" /><span className="w-3 h-3 rounded-full bg-green-400" /></div>
                <span className="text-xs text-center flex-1 text-muted-foreground">patient.microhealth.ng</span>
              </div>
              <div className="flex-1 flex items-center justify-center p-6">
                <div className="w-[180px] rounded-[28px] overflow-hidden" style={{ background: "#F8F9FA", boxShadow: "0 8px 24px rgba(0,0,0,0.12)", border: "6px solid #131E33" }}>
                  {/* Phone content */}
                  <div className="px-3 py-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div><p className="text-[7px] text-muted-foreground">Good morning,</p><p className="text-[9px] font-semibold text-foreground">Yuki Tanaka</p></div>
                      <Bell size={10} className="text-gray-400" />
                    </div>
                  </div>
                  <div className="px-3 pb-3 space-y-2">
                    {/* Hero card mini */}
                    <div className="rounded-xl p-3" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
                      <p className="text-[7px] font-medium text-white opacity-70">Next appointment</p>
                      <p className="text-[9px] font-bold text-white">Dr. L. Ferreira</p>
                      <p className="text-[7px] text-white opacity-60">10 Jul · 10:00 AM</p>
                    </div>
                    {/* Quick actions */}
                    <div className="grid grid-cols-4 gap-1">
                      {[Calendar, FlaskConical, Pill, FileText].map((Icon, i) => (
                        <div key={i} className="flex flex-col items-center gap-1 p-1.5 rounded-lg" style={{ background: "#F8F9FA" }}>
                          <Icon size={9} style={{ color: "#0F7D7A" }} />
                          <div className="w-6 h-1 rounded-full bg-muted" />
                        </div>
                      ))}
                    </div>
                    {/* Reminders */}
                    {[Pill, Activity].map((Icon, i) => (
                      <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg" style={{ background: "#F8F9FA" }}>
                        <Icon size={9} style={{ color: "#0F7D7A" }} />
                        <div className="flex-1"><div className="h-1.5 rounded-full bg-muted w-3/4 mb-1" /><div className="h-1 rounded-full bg-muted w-1/2 opacity-60" /></div>
                      </div>
                    ))}
                  </div>
                  {/* Bottom nav */}
                  <div className="flex border-t" style={{ borderColor: "rgba(0,0,0,0.08)" }}>
                    {[Home, Calendar, Activity, MessageSquare, User].map((Icon, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center py-1.5">
                        <Icon size={9} style={{ color: i === 0 ? "#0F7D7A" : "#D1D5DB" }} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="px-5 py-3 flex items-center justify-between" style={{ borderTop: "1px solid rgba(0,0,0,0.06)" }}>
                <span className="text-xs text-muted-foreground">Patient Portal · 375px</span>
                <button className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white" style={{ background: "#0F7D7A" }} onClick={() => navigate("/patient/home")}>Open →</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0A5E5C 0%, #0F7D7A 50%, #131E33 100%)" }}>
        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-5" style={{ letterSpacing: "-0.02em" }}>
            Ready to run a smarter<br />facility?
          </h2>
          <p className="text-base mb-10" style={{ color: "rgba(255,255,255,0.65)" }}>
            Join 200+ facilities already on MicroHealth. Set up in under 48 hours. Cancel anytime.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button className="flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold text-white transition-all"
              style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(8px)" }}
              onClick={() => navigate("/login")}>
              Staff Sign In
            </button>
            <button className="flex items-center gap-2 px-8 py-4 rounded-xl text-sm font-semibold transition-all"
              style={{ background: "#fff", color: "#0F7D7A", boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }}
              onClick={() => navigate("/admin/dashboard")}>
              Explore Demo <ArrowRight size={15} />
            </button>
          </div>
        </div>
        {/* Decorative */}
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10" style={{ background: "rgba(255,255,255,0.15)" }} />
        <div className="absolute -bottom-32 -left-20 w-96 h-96 rounded-full opacity-5" style={{ background: "#fff" }} />
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-14 px-6" style={{ background: "#0D1520" }}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}>
                  <Heart size={16} color="#fff" />
                </div>
                <span className="text-lg font-bold text-white">MicroHealth</span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.4)", maxWidth: 240 }}>
                The operating system for modern healthcare facilities in Nigeria and beyond.
              </p>
            </div>
            {[
              { title: "Platform", links: ["Dashboard", "Patient Portal", "Pharmacy", "Analytics", "API Access"] },
              { title: "Company", links: ["About us", "Careers", "Press", "Blog"] },
              { title: "Support", links: ["Documentation", "Help Centre", "Status page", "Contact us"] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>{title}</p>
                <div className="space-y-2.5">
                  {links.map(l => (
                    <a key={l} href="#" className="block text-sm transition-colors" style={{ color: "rgba(255,255,255,0.5)" }}
                      onMouseEnter={e => (e.currentTarget.style.color = "#36A09D")}
                      onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.5)")}>
                      {l}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between pt-8 flex-wrap gap-4" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>© 2026 MicroHealth Technologies Ltd. All rights reserved.</p>
            <div className="flex gap-6">
              {["Privacy Policy", "Terms of Service", "Cookie Policy"].map(l => (
                <a key={l} href="#" className="text-xs transition-colors" style={{ color: "rgba(255,255,255,0.3)" }}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/patient/login" element={<PatientLoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="patients" element={<PatientsList />} />
          <Route path="patients/:id" element={<AdminPatientProfile />} />
          <Route path="appointments" element={<AppointmentsPage />} />
          <Route path="consultations" element={<ConsultationsPage />} />
          <Route path="vitals" element={<VitalsDashboard />} />
          <Route path="labs" element={<LabTestsPage />} />
          <Route path="prescriptions" element={<PrescriptionsPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="payments" element={<PaymentsPage />} />
          <Route path="referrals" element={<ReferralsPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        <Route path="/patient" element={<PatientLayout />}>
          <Route index element={<Navigate to="home" replace />} />
          <Route path="home" element={<PatientHome />} />
          <Route path="book" element={<BookAppointment />} />
          <Route path="appointments" element={<PatientAppointments />} />
          <Route path="vitals" element={<PatientVitals />} />
          <Route path="prescriptions" element={<PatientPrescriptions />} />
          <Route path="labs" element={<PatientLabs />} />
          <Route path="family" element={<FamilyMembers />} />
          <Route path="messages" element={<PatientMessages />} />
          <Route path="profile" element={<PatientProfilePage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
