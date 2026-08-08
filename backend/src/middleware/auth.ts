import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { AppError } from "./errorHandler";

export interface AuthPayload {
  userId: string;
  role: "admin" | "staff" | "patient";
  unitId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const token = req.cookies?.token || req.headers.authorization?.replace("Bearer ", "");
  if (!token) throw new AppError("Authentication required", 401, "UNAUTHORIZED");
  try {
    const payload = jwt.verify(token, config.JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    throw new AppError("Invalid or expired token", 401, "INVALID_TOKEN");
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw new AppError("Authentication required", 401);
    if (!roles.includes(req.user.role)) {
      throw new AppError("Insufficient permissions", 403, "FORBIDDEN");
    }
    next();
  };
}
