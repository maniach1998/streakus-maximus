import { Router } from "express";

import { requireAuth } from "../middlewares/auth.js";
import { getTopActiveHabits, getTopActiveStreaks } from "../data/habits.js";
import { getWeeklyOverview } from "../data/stats.js";
import { canMarkComplete } from "../helpers.js";

const router = Router();

// require auth for all routes
router.use(requireAuth);

router.route("/").get(async (req, res) => {
	try {
		const [habits, streaks, weeklyOverview] = await Promise.all([
			getTopActiveHabits(req.session.user._id, 4),
			getTopActiveStreaks(req.session.user._id, 6),
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
			title: "Dashboard | Streakus Maximus",
			user: req.session.user,
			habits: habitsWithStatus,
			streaks,
			hasStreaks: streaks.length > 0,
			weeklyOverview,
		});
	} catch (err) {
		return res.status(err.cause || 500).render("error", {
			title: "Error | Streakus Maximus",
			code: err.cause || 500,
			message: err.message || "Internal server error",
			error: err,
		});
	}
});

export default router;
