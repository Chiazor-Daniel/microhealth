import { api } from "./api";

export const dashboardService = {
  getKpi: () => api.get<any>("/dashboard/kpi"),
  getAlerts: () => api.get<any[]>("/dashboard/alerts"),
  getWardOccupancy: () => api.get<any[]>("/dashboard/ward-occupancy"),
  getShiftSummary: () => api.get<any>("/dashboard/shift-summary"),
  getPatientDashboard: () => api.get<any>("/dashboard/patient-home"),
  getPatientTrends: () => api.get<any[]>("/reports/patient-trends"),
};
