import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { useAuth } from "./useAuth";
import { appointmentService, type Appointment } from "../services/appointment.service";
import { vitalService, type Vital } from "../services/vital.service";
import { labService, type LabTest } from "../services/lab.service";
import { prescriptionService, type Prescription } from "../services/prescription.service";
import { familyService, type FamilyMember } from "../services/family.service";
import { messageService } from "../services/message.service";

export interface PatientData {
  appointments: Appointment[];
  vitals: Vital[];
  labs: LabTest[];
  prescriptions: Prescription[];
  family: FamilyMember[];
  notifications: any[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const PatientDataContext = createContext<PatientData | null>(null);

export function PatientDataProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, role } = useAuth();
  const patientId = user?.profile?.id;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [vitals, setVitals] = useState<Vital[]>([]);
  const [labs, setLabs] = useState<LabTest[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [family, setFamily] = useState<FamilyMember[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!patientId) return;
    setLoading(true);
    setError(null);
    try {
      const [
        appts,
        vitalsData,
        labsData,
        rxData,
        familyData,
        notifs,
      ] = await Promise.all([
        appointmentService.listByPatient(patientId),
        vitalService.getByPatient(patientId),
        labService.getByPatient(patientId),
        prescriptionService.getByPatient(patientId),
        familyService.listByPatient(patientId),
        messageService.listNotifications(),
      ]);
      setAppointments(appts);
      setVitals(vitalsData);
      setLabs(labsData);
      setPrescriptions(rxData);
      setFamily(familyData);
      setNotifications(notifs);
    } catch (err: any) {
      setError(err?.message || "Failed to load patient data");
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    if (!isAuthenticated || role !== "patient") return;
    fetchAll();
  }, [isAuthenticated, role, patientId, fetchAll]);

  return (
    <PatientDataContext.Provider
      value={{
        appointments,
        vitals,
        labs,
        prescriptions,
        family,
        notifications,
        loading,
        error,
        refresh: fetchAll,
      }}
    >
      {children}
    </PatientDataContext.Provider>
  );
}

export function usePatientData() {
  const ctx = useContext(PatientDataContext);
  if (!ctx) throw new Error("usePatientData must be used within PatientDataProvider");
  return ctx;
}
