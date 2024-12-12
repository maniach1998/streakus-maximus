import { Router } from "express";

import { requireAuth } from "../middlewares/auth.js";
import { getActiveStreaks, getUserHabits } from "../data/habits.js";
import { getWeeklyOverview } from "../data/stats.js";
import { canMarkComplete } from "../helpers.js";

const router = Router();

// require auth for all routes
router.use(requireAuth);

router.route("/").get(async (req, res) => {
	try {
		const [habits, streaks, weeklyOverview] = await Promise.all([
			getUserHabits(req.session.user._id, "active"),
			getActiveStreaks(req.session.user._id),
			getWeeklyOverview(req.session.user._id),
		]);

		// Add completion status to habits
		const habitsWithStatus = await Promise.all(
			habits.map(async (habit) => ({
				...habit,
				canComplete: await canMarkComplete(habit, req.session.user._id),
			}))
		);

		return res.render("dashboard/dashboard", {
			title: "Dashboard",
			user: req.session.user,
			habits: habitsWithStatus,
			streaks,
			hasStreaks: streaks.length > 0,
			weeklyOverview,
		});
	} catch (err) {
		return res.status(err.cause || 500).render("error", {
			title: "Error",
			code: err.cause || 500,
			message: err.message || "Internal server error",
			error: err,
		});
	}
});

export default router;
