import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as ctrl from "../controllers/family.controller";

/** Family groups. Patients only act inside their own groups. */
export const familyRoutes = Router();
familyRoutes.use(authenticate);

familyRoutes.post("/", ctrl.create);
familyRoutes.get("/mine", ctrl.mine);
familyRoutes.get("/:id/members", ctrl.members);
familyRoutes.post("/:id/invite", ctrl.invite);
familyRoutes.post("/accept", ctrl.accept);
familyRoutes.delete("/members/:membershipId", ctrl.removeMember);
