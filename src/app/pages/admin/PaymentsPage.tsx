import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { DollarSign, ClipboardList, AlertCircle, Download, TrendingUp } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import PageHeader from "../../components/shared/PageHeader";
import { GhostBtn } from "../../components/shared/Buttons";
import { TableCard, Th, Td, TrHover, InitialsAvatar } from "../../components/shared/TableComponents";
import KpiCard from "../../components/shared/KpiCard";
import ChartTooltip from "../../components/shared/ChartTooltip";
import { SkeletonCard, SkeletonTable } from "../../components/shared/Skeleton";
import { ErrorState } from "../../components/shared/ErrorState";
import { paymentService } from "../../services/payment.service";
import StatusPill from "../../components/shared/StatusPill";
import { error as showError } from "../../components/shared/SweetAlert";
import { downloadCsv } from "../../utils/csvExport";

const TU = TrendingUp;

function PaymentsPage() {
  const [payments, setPayments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      paymentService.list(),
      paymentService.getStats(),
    ])
      .then(([paymentsData, statsData]) => {
        setPayments(paymentsData);
        setStats(statsData);
      })
      .catch(err => setError(err.message || "Failed to load payments"))
      .finally(() => setLoading(false));
  }, []);

  const totalPaid = stats?.totalPaid?.sum ? Number(stats.totalPaid.sum) : payments.filter(p => p.status === "paid").reduce((s, p) => s + Number(p.amount || 0), 0);
  const totalPending = stats?.totalPending?.sum ? Number(stats.totalPending.sum) : payments.filter(p => p.status === "pending").reduce((s, p) => s + Number(p.amount || 0), 0);
  const paidCount = stats?.totalPaid?.count || payments.filter(p => p.status === "paid").length;
  const avgTxn = paidCount ? totalPaid / paidCount : 0;

  const revenueByDay = payments
    .filter(p => p.status === "paid" && p.paidAt)
    .reduce((acc: Record<string, number>, p) => {
      const day = new Date(p.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      acc[day] = (acc[day] || 0) + Number(p.amount || 0);
      return acc;
    }, {});
  const revenueTrend = Object.entries(revenueByDay).slice(-7).map(([day, revenue]) => ({ day, revenue }));

  const deptMap = payments
    .filter(p => p.status === "paid")
    .reduce((acc: Record<string, number>, p) => {
      const dept = p.service?.split(" ")[0] || "Other";
      acc[dept] = (acc[dept] || 0) + Number(p.amount || 0);
      return acc;
    }, {});
  const totalDept = Object.values(deptMap).reduce((a: number, b: number) => a + b, 0);
  const deptData = Object.entries(deptMap).map(([dept, value]) => ({
    dept,
    value: totalDept ? Math.round((value / totalDept) * 100) : 0,
    color: ["#0F7D7A", "#36A09D", "#4CAF50", "#F59E0B", "#8B5CF6", "#EF4444"][Object.keys(deptMap).indexOf(dept) % 6],
  }));

  const getPatientName = (p: any) => p.patient?.user ? `${p.patient.user.firstName} ${p.patient.user.lastName}` : p.patient?.name || "Unknown";

  const formatNaira = (v: number) => `₦${Math.round(v).toLocaleString()}`;

  if (error) return <ErrorState message={error} />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-4">
      <PageHeader title="Payments & Revenue" subtitle="Financial overview" action={
        <GhostBtn icon={Download} onClick={() => downloadCsv("revenue.csv", revenue?.dailyRevenue?.map((d: any) => ({
          date: d.day,
          revenue: d.revenue,
          transactions: d.transactions,
        })) || [])}>Export Report</GhostBtn>
      } />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          <><SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard /></>
        ) : (
          <>
            <KpiCard icon={DollarSign} label="Total Revenue" value={formatNaira(totalPaid)} delta="—" deltaUp sub="paid transactions" color="#0F7D7A" />
            <KpiCard icon={ClipboardList} label="Transactions" value={String(paidCount)} delta="—" deltaUp sub="successful" color="#36A09D" />
            <KpiCard icon={TU} label="Avg Transaction" value={formatNaira(avgTxn)} delta="—" deltaUp sub="per paid txn" color="#4CAF50" />
            <KpiCard icon={AlertCircle} label="Pending Payments" value={formatNaira(totalPending)} delta="—" deltaUp={false} sub="outstanding" color="#F59E0B" />
          </>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: "var(--skeuo-card-gradient)", boxShadow: "var(--skeuo-shadow)", border: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 className="text-base font-bold text-foreground mb-1">Revenue Trend</h3>
          <p className="text-xs text-muted-foreground mb-4">Recent paid transactions</p>
          {loading ? (
            <div className="h-[200px] rounded-xl animate-pulse" style={{ background: "#F3F4F6" }} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueTrend} margin={{ top: 0, right: 4, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `₦${v / 1000}k`} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="revenue" fill="#0F7D7A" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="rounded-2xl p-5 flex flex-col" style={{ background: "var(--skeuo-card-gradient)", boxShadow: "var(--skeuo-shadow)", border: "1px solid rgba(0,0,0,0.06)" }}>
          <h3 className="text-base font-bold text-foreground mb-1">Revenue by Service</h3>
          <p className="text-xs text-muted-foreground mb-4">Percentage split</p>
          {loading ? (
            <div className="h-[200px] rounded-xl animate-pulse" style={{ background: "#F3F4F6" }} />
          ) : (
            <div className="flex-1 min-h-[200px]">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={deptData} dataKey="value" nameKey="dept" innerRadius={50} outerRadius={70} paddingAngle={3} stroke="none">
                    {deptData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
      <TableCard title="Transaction History" action={<GhostBtn icon={Download} onClick={() => downloadCsv("transactions.csv", payments.map(p => ({
        patient: getPatientName(p),
        service: p.service || "—",
        amount: `₦${Math.round(Number(p.amount)).toLocaleString()}`,
        method: p.method || "—",
        date: p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-GB") : "—",
        status: p.status,
      })))}>CSV</GhostBtn>}>
        <table className="w-full text-sm">
          <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}><tr><Th>Patient</Th><Th>Service</Th><Th>Amount</Th><Th>Method</Th><Th>Date</Th><Th>Status</Th></tr></thead>
          <tbody>
            {loading ? (
              <>
                {Array.from({ length: 5 }).map((_, i) => <tr key={i} className="animate-pulse">
                  {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="h-3 rounded" style={{ background: "#E5E7EB" }} /></td>)}
                </tr>)}
              </>
            ) : (
              payments.map(p => (
                <TrHover key={p.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <InitialsAvatar name={getPatientName(p)} size="sm" />
                      <span className="font-semibold text-foreground">{getPatientName(p)}</span>
                    </div>
                  </Td>
                  <Td className="text-muted-foreground">{p.service || "—"}</Td>
                  <Td className="font-semibold text-foreground">{formatNaira(Number(p.amount))}</Td>
                  <Td className="text-muted-foreground">{p.method || "—"}</Td>
                  <Td className="text-muted-foreground whitespace-nowrap">{p.paidAt ? new Date(p.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}</Td>
                  <Td><StatusPill status={p.status} /></Td>
                </TrHover>
              ))
            )}
            {!loading && payments.length === 0 && <tr><Td colSpan={6} className="text-center py-12 text-muted-foreground">No transactions.</Td></tr>}
          </tbody>
        </table>
      </TableCard>
    </motion.div>
  );
}

export default PaymentsPage;
