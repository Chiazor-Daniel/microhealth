import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, MessageSquareText } from "lucide-react";
import PageHeader from "../../components/shared/PageHeader";
import { PrimaryBtn } from "../../components/shared/Buttons";
import { TableCard, Th, Td, TrHover, InitialsAvatar } from "../../components/shared/TableComponents";
import { SkeletonCard, SkeletonTable } from "../../components/shared/Skeleton";
import { ErrorState } from "../../components/shared/ErrorState";
import { Modal } from "../../components/shared/Modal";
import { FormInput, FormTextarea } from "../../components/shared/FormInput";
import { messageService } from "../../services/message.service";
import { error as showError, success, confirmAction } from "../../components/shared/SweetAlert";

function MessagesPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ recipientId: "", subject: "", content: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    messageService.list()
      .then(data => setMessages(data))
      .catch(err => setError(err.message || "Failed to load messages"))
      .finally(() => setLoading(false));
  }, []);

  const getName = (m: any) => m.sender ? `${m.sender.firstName} ${m.sender.lastName}` : m.from || "Unknown";

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.recipientId || !form.content) {
      showError("Validation", "Recipient and message are required");
      return;
    }
    const confirmed = await confirmAction("Send message?", "Send this message to the selected recipient?", "Send");
    if (!confirmed) return;
    setSaving(true);
    try {
      await messageService.send(form.recipientId, form.subject ? `${form.subject}: ${form.content}` : form.content);
      success("Message sent");
      setModalOpen(false);
      setForm({ recipientId: "", subject: "", content: "" });
      const data = await messageService.list();
      setMessages(data);
    } catch (err: any) {
      showError("Send failed", err.message);
    } finally {
      setSaving(false);
    }
  };

  if (error) return <ErrorState message={error} />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5 pb-4">
      <PageHeader title="Messages" subtitle="Internal communications and patient reminders"
        action={<PrimaryBtn icon={Plus} onClick={() => setModalOpen(true)}>New Message</PrimaryBtn>}
      />
      <TableCard title="Inbox">
        <table className="w-full text-sm">
          <thead style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}><tr><Th>From</Th><Th>Message</Th><Th>Time</Th><Th>Status</Th></tr></thead>
          <tbody>
            {loading ? (
              <SkeletonTable rows={5} cols={4} />
            ) : (
              <>
                {messages.map(m => (
                  <TrHover key={m.id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <InitialsAvatar name={getName(m)} size="sm" />
                        <span className="font-semibold text-foreground">{getName(m)}</span>
                      </div>
                    </Td>
                    <Td className="text-muted-foreground max-w-md truncate">{m.content || m.msg || m.message || ""}</Td>
                    <Td className="text-muted-foreground whitespace-nowrap">{m.sentAt ? new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}</Td>
                    <Td>{m.isRead ? <span className="text-xs font-bold text-emerald-600">Read</span> : <span className="text-xs font-bold text-[#0F7D7A]">Unread</span>}</Td>
                  </TrHover>
                ))}
                {messages.length === 0 && <tr><Td colSpan={4} className="text-center py-12 text-muted-foreground">
                  <MessageSquareText size={28} className="mx-auto mb-2 opacity-40" />No messages.
                </Td></tr>}
              </>
            )}
          </tbody>
        </table>
      </TableCard>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Message" size="md">
        <form onSubmit={handleCreate}>
          <FormInput label="Recipient ID" value={form.recipientId} onChange={v => setForm({ ...form, recipientId: v })} required />
          <FormInput label="Subject" value={form.subject} onChange={v => setForm({ ...form, subject: v })} />
          <FormTextarea label="Message" value={form.content} onChange={v => setForm({ ...form, content: v })} required />
          <div className="flex gap-3 mt-2">
            <motion.button type="button" whileTap={{ scale: 0.97 }} onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl text-sm font-bold border" style={{ color: "#6B7280", borderColor: "rgba(0,0,0,0.1)", background: "var(--skeuo-card-gradient)" }}>Cancel</motion.button>
            <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={saving} className="flex-1 py-3 rounded-xl text-sm font-bold text-white disabled:opacity-60" style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 6px 12px -2px rgba(15,125,122,0.35), inset 0 1px 0 rgba(255,255,255,0.2)" }}>{saving ? "Sending…" : "Send Message"}</motion.button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}

export default MessagesPage;
