import { api } from "./api";

export const reportService = {
  getDemographics: () => api.get<any>("/reports/demographics"),
  getRevenue: () => api.get<any>("/reports/revenue"),
  getPatientTrends: () => api.get<any[]>("/reports/patient-trends"),
  getDepartmentRevenue: () => api.get<any[]>("/reports/department-revenue"),
};
