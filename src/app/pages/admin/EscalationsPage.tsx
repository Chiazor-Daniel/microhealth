import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Siren } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { TableCard, Th, Td, TrHover } from "../../components/shared/TableComponents";
import { SkeletonTable } from "../../components/shared/Skeleton";
import { ErrorState } from "../../components/shared/ErrorState";
import StatusPill from "../../components/shared/StatusPill";
import { Modal } from "../../components/shared/Modal";
import { FormSelect, FormTextarea } from "../../components/shared/FormInput";
import { PrimaryBtn } from "../../components/shared/Buttons";
import { escalationService } from "../../services/ai.service";
import { error as showError, success } from "../../components/shared/SweetAlert";

/**
 * Nurse escalation queue (Agentic AI MVP, function 4).
 *
 * Every row is a case the agent refused to manage alone: the reason, the
 * urgency, the vitals snapshot, and an AI-written handoff. Acting logs the
 * clinician, the action, and the resolution on the row.
 */
const ACTION_LABELS: Record<string, string> = {
  message_user: "Message user",
  call_user: "Call user",
  request_recheck: "Request recheck",
  book_visit: "Book visit",
  refer: "Refer",
  close_case: "Close case",
};

function EscalationsPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [actions, setActions] = useState<string[]>([]);
  const [filter, setFilter] = useState("open");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acting, setActing] = useState<any | null>(null);
  const [action, setAction] = useState("message_user");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([escalationService.queue(filter === "all" ? undefined : filter), escalationService.actions()])
      .then(([q, a]) => {
        setRows(q);
        setActions(a);
        setLoading(false);
      })
      .catch((e) => {
        setError(e?.message ?? "Couldn't load the queue.");
        setLoading(false);
      });
  };

  useEffect(load, [filter]);

  const submit = async () => {
    if (!acting) return;
    setSaving(true);
    try {
      await escalationService.act(acting.id, action, note || undefined);
      success("Logged on the case.");
      setActing(null);
      setNote("");
      load();
    } catch (e: any) {
      showError(e?.message ?? "Couldn't log the action.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <SkeletonTable />;
  if (error) return <ErrorState message={error} onRetry={load} />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <PageHeader
        title="Escalations"
        subtitle="Cases the agent routed to human review"
        icon={<Siren size={20} />}
        actions={
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-xl text-sm border border-slate-200 bg-white"
          >
            <option value="open">Open</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="resolved">Resolved</option>
            <option value="all">All</option>
          </select>
        }
      />

      <TableCard>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <Th>Patient</Th>
              <Th>Urgency</Th>
              <Th>Reason</Th>
              <Th>Handoff</Th>
              <Th>Status</Th>
              <Th>Action taken</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <TrHover key={r.id}>
                <Td>
                  <div className="font-semibold">{r.patientName ?? "—"}</div>
                  <div className="text-xs text-slate-500">{r.patientPhone ?? ""}</div>
                </Td>
                <Td>
                  <StatusPill status={r.urgency === "immediate" ? "urgent" : r.urgency === "prompt" ? "attention" : "info"} />
                </Td>
                <Td className="max-w-[220px]">{r.reason}</Td>
                <Td className="max-w-[320px] text-slate-600">{r.caseSummary ?? "—"}</Td>
                <Td>
                  <StatusPill status={r.status} />
                </Td>
                <Td>{r.actionTaken ? ACTION_LABELS[r.actionTaken] ?? r.actionTaken : "—"}</Td>
                <Td>
                  {r.status !== "resolved" && (
                    <button
                      onClick={() => {
                        setActing(r);
                        setAction("message_user");
                      }}
                      className="px-3 py-1.5 rounded-lg text-[12px] font-semibold bg-teal-700 text-white"
                    >
                      Act
                    </button>
                  )}
                </Td>
              </TrHover>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="text-sm text-slate-500 px-5 py-8 text-center">Queue clear. Nothing waiting for review.</p>}
      </TableCard>

      <Modal open={!!acting} onClose={() => setActing(null)} title={`Act — ${acting?.patientName ?? ""}`}>
        <div className="space-y-3">
          <FormSelect label="Action" value={action} onChange={setAction} options={actions.map((a) => ({ value: a, label: ACTION_LABELS[a] ?? a }))} />
          <FormTextarea label="Note (optional)" value={note} onChange={setNote} placeholder="What was done, and the follow-up plan" />
          <PrimaryBtn onClick={submit} loading={saving}>
            Log action
          </PrimaryBtn>
        </div>
      </Modal>
    </motion.div>
  );
}

export default EscalationsPage;
