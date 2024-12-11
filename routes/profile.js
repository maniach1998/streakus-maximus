import { Router } from "express";

import { getUserProfile } from "../data/users.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth);

router.route("/").get(async (req, res) => {
	try {
		const data = await getUserProfile(req.session.user._id);

		return res.render("profile/profile", {
			title: "Your Profile",
			...data,
		});
	} catch (err) {
		return res.status(err.cause || 500).render("error", {
			title: "Error",
			code: err.cause || 500,
			message: err.message || "Failed to load profile",
		});
	}
});

export default router;
