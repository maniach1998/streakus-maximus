import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.js";
import habitsApiRoutes from "./habits.js";

const router = Router();

router.use(requireAuth);

router.use("/habits", habitsApiRoutes);

export default router;
