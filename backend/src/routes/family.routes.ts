import { Router } from "express";
import { authenticate } from "../middleware/auth";
import * as ctrl from "../controllers/family.controller";

/** Family groups. Patients only act inside their own groups. */
export const familyRoutes = Router();

/* Public: invite-link preview before registration. Returns the family name
   and offered role only — never health data. */
familyRoutes.get("/join/:token", ctrl.resolveLink);

familyRoutes.use(authenticate);

familyRoutes.post("/", ctrl.create);
familyRoutes.get("/mine", ctrl.mine);
familyRoutes.get("/:id/members", ctrl.members);
familyRoutes.post("/:id/invite", ctrl.invite);
familyRoutes.post("/:id/links", ctrl.createLink);
familyRoutes.post("/join", ctrl.joinLink);
familyRoutes.post("/accept", ctrl.accept);
familyRoutes.delete("/members/:membershipId", ctrl.removeMember);
familyRoutes.get("/subscriptions", ctrl.listSubscriptions);
familyRoutes.post("/subscriptions", ctrl.saveSubscription);
familyRoutes.delete("/subscriptions/:targetId", ctrl.deleteSubscription);
