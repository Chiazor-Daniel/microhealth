import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth";
import * as ctrl from "../controllers/inventory.controller";
import { validate } from "../middleware/validate";
import { z } from "zod";

export const inventoryRoutes = Router();
inventoryRoutes.use(authenticate);

const schema = z.object({
  name: z.string(),
  category: z.string(),
  stock: z.number().optional(),
  minStock: z.number().optional(),
  unit: z.string(),
  unitCost: z.number().optional(),
});

inventoryRoutes.get("/", authorize("admin","staff"), ctrl.list);
inventoryRoutes.get("/low-stock", authorize("admin","staff"), ctrl.getLowStock);
inventoryRoutes.post("/", authorize("admin","staff"), validate(schema), ctrl.create);
inventoryRoutes.patch("/:id/stock", authorize("admin","staff"), ctrl.adjustStock);
inventoryRoutes.delete("/:id", authorize("admin"), ctrl.remove);
