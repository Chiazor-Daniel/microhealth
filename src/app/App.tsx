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
import EscalationsPage from "./pages/admin/EscalationsPage";
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

// New patient experience
import Home from "./patient/pages/Home";
import Vitals from "./patient/pages/Vitals";
import AI from "./patient/pages/AI";
import Care from "./patient/pages/Care";
import Profile from "./patient/pages/Profile";
import Notifications from "./patient/pages/Notifications";
import AIInsights from "./patient/pages/AIInsights";
import VitalsDetail from "./patient/pages/VitalsDetail";

// Legacy patient sub-pages reused under /patient/care/* and /patient/book, /patient/family
import BookAppointment from "./pages/patient/BookAppointment";
import PatientAppointments from "./pages/patient/PatientAppointments";
import PatientPrescriptions from "./pages/patient/PatientPrescriptions";
import PatientLabs from "./pages/patient/PatientLabs";
import PatientMessages from "./pages/patient/PatientMessages";
import FamilyMembers from "./pages/patient/FamilyMembers";

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
        <Route path="escalations" element={<EscalationsPage />} />
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

      {/* Patient — redesigned experience */}
      <Route path="/patient" element={<PatientLayout />}>
        <Route index element={<Navigate to="/patient/home" replace />} />

        {/* New primary screens */}
        <Route path="home" element={<Home />} />
        <Route path="vitals" element={<Vitals />} />
        <Route path="ai" element={<AI />} />
        <Route path="care" element={<Care />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="insights" element={<AIInsights />} />
        <Route path="vitals/:metric" element={<VitalsDetail />} />

        {/* Care sub-pages (legacy pages reused) */}
        <Route path="care/appointments" element={<PatientAppointments />} />
        <Route path="care/prescriptions" element={<PatientPrescriptions />} />
        <Route path="care/labs" element={<PatientLabs />} />
        <Route path="care/messages" element={<PatientMessages />} />

        {/* Utility routes */}
        <Route path="book" element={<BookAppointment />} />
        <Route path="family" element={<FamilyMembers />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
