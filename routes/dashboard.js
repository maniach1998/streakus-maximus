import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../middlewares/auth.js";

const router = Router();

// require auth for all routes
router.use(requireAuth);

router.route("/").get(async (req, res) => {
	const user = req.session.user;

	return res.render("dashboard/dashboard", { title: "Dashboard", user });
});

export default router;
