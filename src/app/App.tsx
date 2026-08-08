import React from "react";
import { Routes, Route, Navigate } from "react-router";

// Layouts
import AdminLayout from "./layouts/AdminLayout";
import PatientLayout from "./layouts/PatientLayout";

// Auth pages
import LoginPage from "./pages/auth/LoginPage";
import PatientLoginPage from "./pages/auth/PatientLoginPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";

// System pages
import UnauthorizedPage from "./pages/system/UnauthorizedPage";
import NotFoundPage from "./pages/system/NotFoundPage";

// Public pages
import LandingPage from "./pages/public/LandingPage";
import AboutPage from "./pages/public/AboutPage";
import SolutionPage from "./pages/public/SolutionPage";
import PricingPage from "./pages/public/PricingPage";
import PartnersPage from "./pages/public/PartnersPage";
import ContactPage from "./pages/public/ContactPage";
import PitchPage from "./pages/public/PitchPage";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import PatientsList from "./pages/admin/PatientsList";
import AdminPatientProfile from "./pages/admin/AdminPatientProfile";
import AppointmentsPage from "./pages/admin/AppointmentsPage";
import ConsultationsPage from "./pages/admin/ConsultationsPage";
import VitalsDashboard from "./pages/admin/VitalsDashboard";
import LabTestsPage from "./pages/admin/LabTestsPage";
import PrescriptionsPage from "./pages/admin/PrescriptionsPage";
import InventoryPage from "./pages/admin/InventoryPage";
import PaymentsPage from "./pages/admin/PaymentsPage";
import ReferralsPage from "./pages/admin/ReferralsPage";
import ReportsPage from "./pages/admin/ReportsPage";
import StaffPage from "./pages/admin/StaffPage";
import MessagesPage from "./pages/admin/MessagesPage";
import SettingsPage from "./pages/admin/SettingsPage";

// Patient pages
import PatientHome from "./pages/patient/PatientHome";
import BookAppointment from "./pages/patient/BookAppointment";
import PatientAppointments from "./pages/patient/PatientAppointments";
import PatientVitals from "./pages/patient/PatientVitals";
import PatientPrescriptions from "./pages/patient/PatientPrescriptions";
import PatientLabs from "./pages/patient/PatientLabs";
import FamilyMembers from "./pages/patient/FamilyMembers";
import PatientMessages from "./pages/patient/PatientMessages";
import PatientProfilePage from "./pages/patient/PatientProfilePage";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/solution" element={<SolutionPage />} />
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/partners" element={<PartnersPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/pitch" element={<PitchPage />} />

      {/* Auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/patient/login" element={<PatientLoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      {/* Admin */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
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

      {/* Patient */}
      <Route path="/patient" element={<PatientLayout />}>
        <Route index element={<Navigate to="/patient/home" replace />} />
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

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
