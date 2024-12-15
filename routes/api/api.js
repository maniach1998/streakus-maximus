import { Router } from "express";

import { requireAuth } from "../../middlewares/auth.js";
import authApiRoutes from "./auth.js";
import habitsApiRoutes from "./habits.js";

const router = Router();

router.use(requireAuth);

router.use("/auth", authApiRoutes);
router.use("/habits", habitsApiRoutes);

export default router;
