import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { AppError } from "./errorHandler";

export function validate(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      result.error.errors.map(e => ({
        field: e.path.join("."),
        message: e.message,
      }));
      throw new AppError("Validation failed", 400, "VALIDATION_ERROR");
    }
    req.body = result.data;
    next();
  };
}
