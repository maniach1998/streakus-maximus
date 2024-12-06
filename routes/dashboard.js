import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.route("/").get(requireAuth, async (req, res) => {
	const user = req.session.user;

	return res.render("dashboard/dashboard", { title: "Dashboard", user });
});

export default router;
