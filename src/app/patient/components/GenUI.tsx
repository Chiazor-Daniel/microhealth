import { useState } from "react";
import { useNavigate } from "react-router";
import { HeartIcon, DropletIcon, OxygenIcon, ThermometerIcon, CalendarIcon, CheckIcon, AlertIcon } from "../icons";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis } from "recharts";
import { motion } from "motion/react";
import { patientTheme, vitalStatusColor } from "../theme";
import { AppointmentCard } from "./AppointmentCard";
import { MedicationCard } from "./MedicationCard";
import { LabResultCard } from "./LabResultCard";

export interface GenUIElement {
  type: string;
  content?: string;
  data?: Record<string, any>;
  options?: { label: string; value: string; metadata?: Record<string, any> }[];
  actions?: { label: string; action: string; payload?: Record<string, any> }[];
}

interface GenUIProps {
  elements: GenUIElement[];
  onAction?: (action: string, payload?: any) => void;
}

export function GenUI({ elements, onAction }: GenUIProps) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string | null>(null);

  if (!elements || elements.length === 0) return null;

  return (
    <div className="space-y-3 mt-3">
      {elements.map((el, i) => {
        switch (el.type) {
          case "text":
            return (
              <p key={i} className="text-sm" style={{ color: patientTheme.colors.textSecondary }}>
                {el.content}
              </p>
            );

          case "vital_card":
            return (
              <div
                key={i}
                className="mh-card p-4"
              >
                <div className="flex items-center gap-2 mb-1">
                  {el.data?.label?.includes("Heart") ? <HeartIcon size={17} style={{ color: vitalStatusColor(el.data?.status) }} /> : null}
                  {el.data?.label?.includes("Blood") ? <DropletIcon size={17} style={{ color: vitalStatusColor(el.data?.status) }} /> : null}
                  {el.data?.label?.includes("SpO") ? <OxygenIcon size={17} style={{ color: vitalStatusColor(el.data?.status) }} /> : null}
                  {el.data?.label?.includes("Temp") ? <ThermometerIcon size={17} style={{ color: vitalStatusColor(el.data?.status) }} /> : null}
                  <span className="text-xs font-medium" style={{ color: patientTheme.colors.textMuted }}>
                    {el.data?.label}
                  </span>
                </div>
                <p className="text-2xl font-bold" style={{ color: patientTheme.colors.textPrimary }}>
                  {el.data?.value} <span className="text-sm font-normal">{el.data?.unit}</span>
                </p>
                <p className="text-xs mt-1" style={{ color: vitalStatusColor(el.data?.status) }}>
                  {el.data?.subtext}
                </p>
              </div>
            );

          case "appointment_card":
            return (
              <AppointmentCard
                key={i}
                department={el.data?.department || "General Practice"}
                doctorName={el.data?.doctorName}
                date={el.data?.date}
                time={el.data?.time}
                status={el.data?.status || "confirmed"}
              />
            );

          case "appointment_selector":
            return (
              <div key={i} className="space-y-2">
                <p className="text-sm font-medium" style={{ color: patientTheme.colors.textSecondary }}>
                  {el.content || "Select an appointment:"}
                </p>
                {el.options?.map((opt) => (
                  <motion.button
                    key={opt.value}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelected(opt.value);
                      onAction?.("select_appointment", opt);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl text-left"
                    style={{
                      background: selected === opt.value ? patientTheme.colors.primaryPale : patientTheme.colors.surface,
                      border: `1px solid ${selected === opt.value ? patientTheme.colors.primaryGreen : patientTheme.colors.border}`,
                    }}
                  >
                    <span className="text-sm font-medium flex items-center gap-2" style={{ color: patientTheme.colors.textPrimary }}>
                      <CalendarIcon size={15} style={{ color: patientTheme.colors.primaryGreen }} />
                      {opt.label}
                    </span>
                    {selected === opt.value && <CheckIcon size={17} style={{ color: patientTheme.colors.primaryGreen }} />}
                  </motion.button>
                ))}
              </div>
            );

          case "medication_card":
            return (
              <MedicationCard
                key={i}
                name={el.data?.name || "Medication"}
                dosage={el.data?.dosage || ""}
                status={el.data?.status || "active"}
              />
            );

          case "lab_card":
            return (
              <LabResultCard
                key={i}
                testName={el.data?.testName || "Lab test"}
                date={el.data?.date || "—"}
                status={el.data?.status || "completed"}
                result={el.data?.result}
              />
            );

          case "triage_question":
            return (
              <div key={i} className="space-y-2">
                <p className="text-sm font-medium" style={{ color: patientTheme.colors.textPrimary }}>
                  {el.content}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {el.options?.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => onAction?.("triage_answer", opt)}
                      className="px-4 py-2 rounded-xl text-sm font-medium"
                      style={{
                        background: patientTheme.colors.surface,
                        border: `1px solid ${patientTheme.colors.border}`,
                        color: patientTheme.colors.textPrimary,
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            );

          case "confirmation":
            return (
              <div key={i} className="p-4 rounded-2xl" style={{ background: patientTheme.colors.primaryPale, border: `1px solid ${patientTheme.colors.primaryGreen}30` }}>
                <p className="text-sm font-medium mb-3" style={{ color: patientTheme.colors.textPrimary }}>
                  {el.content}
                </p>
                <div className="flex gap-2">
                  {el.actions?.map((a) => (
                    <button
                      key={a.label}
                      onClick={() => onAction?.(a.action, a.payload)}
                      className="mh-btn-primary px-4 py-2 rounded-xl text-sm font-semibold"
                      style={{ color: "#fff" }}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            );

          case "quick_actions":
            return (
              <div key={i} className="flex flex-wrap gap-2">
                {el.actions?.map((a) => (
                  <button
                    key={a.label}
                    onClick={() => {
                      if (a.action === "book_appointment") navigate("/patient/book");
                      else if (a.action === "message_team") navigate("/patient/care/messages");
                      else onAction?.(a.action, a.payload);
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold"
                    style={{
                      background: a.action === "call_emergency" ? patientTheme.colors.error : patientTheme.colors.primaryGreen,
                      color: "#fff",
                    }}
                  >
                    {a.action === "call_emergency" && <span className="inline-flex align-[-2px] mr-1"><AlertIcon size={13} /></span>}
                    {a.label}
                  </button>
                ))}
              </div>
            );

          case "trend_chart":
            return (
              <div
                key={i}
                className="mh-card p-4"
              >
                <p className="text-xs font-medium mb-2" style={{ color: patientTheme.colors.textMuted }}>
                  {el.data?.title || "Trend"}
                </p>
                <div className="h-32 -mx-2">
                  {el.data?.values?.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={el.data.values} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="label" tick={{ fontSize: 9, fill: patientTheme.colors.textMuted }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fontSize: 9, fill: patientTheme.colors.textMuted }} axisLine={false} tickLine={false} />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke={patientTheme.colors.primaryGreen}
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 4, fill: patientTheme.colors.primaryGreen }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-xs" style={{ color: patientTheme.colors.textMuted }}>No trend data.</p>
                  )}
                </div>
              </div>
            );

          default:
            return null;
        }
      })}
    </div>
  );
}
