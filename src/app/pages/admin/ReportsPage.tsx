import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Users, Stethoscope, DollarSign, Activity, Download, BarChart3 } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from "recharts";
import PageHeader from "../../components/shared/PageHeader";
import { PrimaryBtn, GhostBtn } from "../../components/shared/Buttons";
import { SkeletonCard, SkeletonPulse } from "../../components/shared/Skeleton";
import { ErrorState } from "../../components/shared/ErrorState";
import KpiCard from "../../components/shared/KpiCard";
import ChartTooltip from "../../components/shared/ChartTooltip";
import { reportService } from "../../services/report.service";
import { dashboardService } from "../../services/dashboard.service";
import { error as showError } from "../../components/shared/SweetAlert";
import { downloadCsv } from "../../utils/csvExport";

function ReportsPage() {
  const [kpi, setKpi] = useState<any>({});
  const [demographics, setDemographics] = useState<any[]>([]);
  const [revenue, setRevenue] = useState<any>({});
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      dashboardService.getKpi(),
      reportService.getDemographics(),
      reportService.getRevenue(),
      reportService.getPatientTrends(),
    ])
      .then(([kpiData, demoData, revData, trendsData]) => {
        setKpi(kpiData);
        setDemographics(Array.isArray(demoData) ? demoData : demoData?.ageGroups || []);
        setRevenue(revData);
        setTrends(Array.isArray(trendsData) ? trendsData : []);
      })
      .catch(err => setError(err.message || "Failed to load reports"))
      .finally(() => setLoading(false));
  }, []);

  if (error) return <ErrorState message={error} />;

  const totalPatients = kpi?.totalPatients ?? "—";
  const totalRevenue = revenue?.totalRevenue ? Number(revenue.totalRevenue).toLocaleString() : "—";
  const totalTransactions = revenue?.totalTransactions ?? "—";

  const barData = demographics.length > 0
    ? demographics.map((d: any) => ({ age: d.age || d.label || d.group, count: d.count || d.value || d.patients }))
    : [{ age: "0–12", count: 0 }, { age: "13–25", count: 0 }, { age: "26–40", count: 0 }, { age: "41–60", count: 0 }, { age: "61+", count: 0 }];

  const areaData = trends.length > 0
    ? trends.map((t: any) => ({
        month: t.month || t.label || "",
        admitted: t.admitted ?? t.count ?? t.value ?? 0,
      }))
    : [];

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-4">
      <PageHeader title="Reports & Analytics" subtitle="Clinical and financial insights"
        action={<div className="flex gap-2">
          <GhostBtn icon={Download} onClick={() => downloadCsv("demographics.csv", demographics.map((d: any) => ({
            group: d.age || d.label || d.group,
            count: d.count || d.value || d.patients,
          })))}>Export CSV</GhostBtn>
          <PrimaryBtn icon={Download} onClick={() => window.print()}>Export PDF</PrimaryBtn>
        </div>}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></> : (
          <>
            <KpiCard icon={Users} label="Total Patients" value={String(totalPatients)} delta="—" deltaUp sub="Current period" color="#0F7D7A" />
            <KpiCard icon={Stethoscope} label="Consultations" value={String(kpi?.consultations ?? "—")} delta="—" deltaUp sub="Current period" color="#36A09D" />
            <KpiCard icon={DollarSign} label="Total Revenue" value={`₦${totalRevenue}`} delta="—" deltaUp sub={String(totalTransactions)} color="#4CAF50" />
            <KpiCard icon={Activity} label="Critical Cases" value={String(kpi?.criticalCases ?? "—")} delta="—" deltaUp sub="Current period" color="#8B5CF6" />
          </>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5" style={{ background: "var(--skeuo-card-gradient)", boxShadow: "var(--skeuo-shadow)", border: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 className="text-base font-bold text-foreground mb-1">Patient Demographics</h3>
          <p className="text-xs text-muted-foreground mb-4">Age group distribution</p>
          {loading ? (
            <div className="h-[200px] rounded-xl animate-pulse" style={{ background: "#F3F4F6" }} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="age" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="count" fill="#0F7D7A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="rounded-2xl p-5" style={{ background: "var(--skeuo-card-gradient)", boxShadow: "var(--skeuo-shadow)", border: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 className="text-base font-bold text-foreground mb-1">Consultation Trends</h3>
          <p className="text-xs text-muted-foreground mb-4">Patient visits over time</p>
          {loading ? (
            <div className="h-[200px] rounded-xl animate-pulse" style={{ background: "#F3F4F6" }} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={areaData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <defs><linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#0F7D7A" stopOpacity={0.2} /><stop offset="95%" stopColor="#0F7D7A" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="admitted" stroke="#0F7D7A" strokeWidth={2.5} fill="url(#gR)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default ReportsPage;
