import { api, setToken } from "./api";

export interface AuthUser {
  id: string;
  email?: string;
  role: "admin" | "staff" | "patient";
  firstName: string;
  lastName: string;
  profile?: any;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: AuthUser;
}

export interface OtpRequiredResponse {
  message: string;
  requiresOtp: true;
  userId: string;
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>("/auth/login", { email, password });
    setToken(res.token);
    return res;
  },

  async patientLogin(phone: string): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>("/auth/patient/login", { phone });
    setToken(res.token);
    return res;
  },

  async forgotPassword(email: string) {
    return api.post("/auth/forgot-password", { email });
  },

  async resetPassword(email: string, token: string, newPassword: string) {
    return api.post("/auth/reset-password", { email, token, newPassword });
  },

  async getMe(): Promise<AuthUser> {
    return api.get("/auth/me");
  },

  async refreshToken() {
    const res = await api.post<{ token: string }>("/auth/refresh");
    setToken(res.token);
    return res;
  },

  logout() {
    setToken(null);
  },
};
