import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Plus, Loader2, X, UserPlus } from "lucide-react";
import { familyService, type FamilyMember } from "../../services/family.service";
import { useAuth } from "../../hooks/useAuth";
import { usePatientData } from "../../hooks/usePatientData";
import { Loading } from "../../components/shared/Loading";
import { ErrorState } from "../../components/shared/ErrorState";
import { success, error as showError } from "../../components/shared/SweetAlert";
import { patientTheme } from "../../patient/theme";
import { StatusBadge } from "../../patient/components/StatusBadge";
import { Avatar } from "../../patient/components/Avatar";
import { variantForRelation } from "../../patient/lib/avatars";

function FamilyMembers() {
  const { user } = useAuth();
  const { family, loading, error, refresh } = usePatientData();
  const userPatientId = user?.profile?.id;
  const [members, setMembers] = useState<FamilyMember[]>(family || []);
  const [patientId, setPatientId] = useState<string | null>(userPatientId || null);
  const [localLoading] = useState(false);
  const [localError] = useState<string | null>(null);
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
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-[22px] font-semibold" style={{ color: patientTheme.colors.textPrimary }}>
          Family Members
        </h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="mh-btn-primary flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold"
        >
          <Plus size={13} /> Add
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mh-mint-card p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: patientTheme.colors.primaryDark }}>
              Add Family Member
            </p>
            <button onClick={() => setShowForm(false)} aria-label="Close">
              <X size={15} style={{ color: patientTheme.colors.textSecondary }} />
            </button>
          </div>

          {[
            { placeholder: "Full name", value: newName, setter: setNewName },
            { placeholder: "Relation (e.g. Spouse, Daughter)", value: newRelation, setter: setNewRelation },
            { placeholder: "Age", value: newAge, setter: setNewAge, type: "number" },
          ].map((field, i) => (
            <input
              key={i}
              type={field.type || "text"}
              className="mh-field w-full px-3.5 py-2.5 rounded-xl text-sm outline-none"
              style={{ color: patientTheme.colors.textPrimary }}
              placeholder={field.placeholder}
              value={field.value}
              onChange={e => field.setter(e.target.value)}
            />
          ))}

          <button
            onClick={handleAdd}
            disabled={saving || !newName.trim() || !newRelation.trim()}
            className="mh-btn-primary w-full py-2.5 text-[13px] font-semibold"
          >
            {saving ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Save Member"}
          </button>
        </motion.div>
      )}

      {members.length === 0 ? (
        <div className="mh-card flex flex-col items-center justify-center py-14 px-6">
          <div className="mh-icon w-12 h-12">
            <UserPlus size={20} />
          </div>
          <p className="text-sm font-semibold mt-3" style={{ color: patientTheme.colors.textPrimary }}>
            No family members yet
          </p>
          <p className="text-[13px] mt-1" style={{ color: patientTheme.colors.textMuted }}>
            Add a dependent to manage their care.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="mh-card p-4"
            >
              <div className="flex items-center gap-3">
                <Avatar seed={m.id} variant={variantForRelation(m.relation)} name={m.name} size={44} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: patientTheme.colors.textPrimary }}>
                    {m.name}
                  </p>
                  <p className="text-[13px]" style={{ color: patientTheme.colors.textSecondary }}>
                    {m.relation}{m.age ? ` · ${m.age}y` : ""}
                  </p>
                </div>
                <StatusBadge status={m.status} />
              </div>

              <div className="flex gap-2 mt-3.5">
                {["View Record", "Book Visit", "Vitals"].map(label => (
                  <button
                    key={label}
                    className="mh-btn-secondary flex-1 px-2 py-2 text-[12px] font-semibold whitespace-nowrap"
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
