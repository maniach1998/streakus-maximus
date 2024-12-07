import { Router } from "express";

import { requireAuth } from "../middlewares/auth.js";
import { getUserHabits } from "../data/habits.js";
import { canMarkComplete } from "../helpers.js";

const router = Router();

// require auth for all routes
router.use(requireAuth);

router.route("/").get(async (req, res) => {
	const user = req.session.user;

	try {
		const activeHabits = await getUserHabits(user._id, "active");
		const habitsWithStatus = await Promise.all(
			activeHabits.map(async (habit) => ({
				...habit,
				canComplete: await canMarkComplete(habit, req.session.user._id),
			}))
		);

		return res.render("dashboard/dashboard", {
			title: "Dashboard",
			user,
			habits: habitsWithStatus,
		});
	} catch (err) {
		return res.status(err.cause || 500).render("dashboard/dashboard", {
			title: "Dashboard",
			user,
			error: err.message || "Internal server error",
		});
	}
});

export default router;
