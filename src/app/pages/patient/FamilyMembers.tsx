import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, Loader2, X, Users, UserPlus } from "lucide-react";
import StatusPill from "../../components/shared/StatusPill";
import { familyService, type FamilyMember } from "../../services/family.service";
import { useAuth } from "../../hooks/useAuth";
import { usePatientData } from "../../hooks/usePatientData";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { success, error as showError } from "../../components/shared/SweetAlert";

function FamilyMembers() {
  const { user } = useAuth();
  const { family, loading, error, refresh } = usePatientData();
  const userPatientId = user?.profile?.id;
  const [members, setMembers] = useState<FamilyMember[]>(family || []);
  const [patientId, setPatientId] = useState<string | null>(userPatientId || null);
  const [localLoading, setLocalLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [newAge, setNewAge] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setMembers(family || []);
    if (userPatientId) setPatientId(userPatientId);
  }, [family, userPatientId]);

  const handleAdd = async () => {
    if (!newName.trim() || !newRelation.trim() || !patientId) return;
    setSaving(true);
    try {
      const member = await familyService.add(patientId, {
        name: newName.trim(),
        relation: newRelation.trim(),
        age: parseInt(newAge) || undefined,
        status: "active",
      });
      setMembers(prev => [...prev, member]);
      setNewName("");
      setNewRelation("");
      setNewAge("");
      setShowForm(false);
      success("Family member added");
      await refresh();
    } catch (err: any) {
      showError("Failed to add", err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading || localLoading) return <Loading />;
  if (error) return <ErrorState message={error} onRetry={refresh} />;
  if (localError) return <ErrorState message={localError} />;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-4 space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">Family Members</h2>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-1 text-xs font-bold px-3 py-2 rounded-xl text-white"
          style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)", boxShadow: "0 4px 10px rgba(15,125,122,0.3)" }}
        >
          <Plus size={12} />Add
        </motion.button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="p-4 rounded-2xl space-y-3"
          style={{ background: "#E6F7F6", border: "1px solid rgba(15,125,122,0.15)", boxShadow: "var(--skeuo-shadow)" }}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold" style={{ color: "#0A5E5C" }}>Add Family Member</p>
            <button onClick={() => setShowForm(false)}><X size={14} style={{ color: "#0F7D7A" }} /></button>
          </div>
          {[
            { placeholder: "Full name", value: newName, setter: setNewName },
            { placeholder: "Relation (e.g. Spouse, Daughter)", value: newRelation, setter: setNewRelation },
            { placeholder: "Age", value: newAge, setter: setNewAge, type: "number" },
          ].map((field, i) => (
            <input
              key={i}
              type={field.type || "text"}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.08)", boxShadow: "var(--skeuo-shadow-inset)" }}
              placeholder={field.placeholder}
              value={field.value}
              onChange={e => field.setter(e.target.value)}
            />
          ))}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleAdd}
            disabled={saving || !newName.trim() || !newRelation.trim()}
            className="w-full py-2.5 text-xs font-bold rounded-xl text-white disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #0F7D7A, #0A5E5C)" }}
          >
            {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Save Member"}
          </motion.button>
        </motion.div>
      )}

      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <UserPlus size={36} className="mb-3 opacity-40" />
          <p className="text-sm">No family members yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="p-4 rounded-2xl"
              style={{ background: "var(--skeuo-card-gradient)", boxShadow: "var(--skeuo-shadow)", border: "1px solid rgba(0,0,0,0.06)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{ background: "linear-gradient(135deg, #E6F7F6, #B2E8E6)", color: "#0A5E5C", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)" }}
                >
                  {m.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-foreground">{m.name}</p>
                  <p className="text-xs text-muted-foreground">{m.relation} · {m.age}y</p>
                </div>
                <StatusPill status={m.status} />
              </div>
              <div className="flex gap-2">
                {["View Record", "Book Visit", "Vitals"].map(label => (
                  <button
                    key={label}
                    className="flex-1 py-2 text-xs font-bold rounded-xl transition-all"
                    style={{ background: "#E6F7F6", color: "#0F7D7A", boxShadow: "var(--skeuo-shadow-sm)" }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

export default FamilyMembers;
