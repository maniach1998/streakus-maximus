import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../middlewares/auth.js";
import {
	createHabit,
	getUserHabits,
	getHabitById,
	updateHabit,
} from "../data/habits.js";
import { getHabitStats } from "../data/stats.js";
import { canMarkComplete } from "../helpers.js";

const router = Router();

router.use(requireAuth);

router
	.route("/")
	.get(async (req, res) => {
		try {
			// TODO: validate query status, and redirect to proper query status page
			const status = req.query.status || "active";
			const habits = await getUserHabits(req.session.user._id, status);

			const habitsWithStatus = await Promise.all(
				habits.map(async (habit) => ({
					...habit,
					canComplete: await canMarkComplete(habit, req.session.user._id),
				}))
			);

			return res.render("habits/allHabits", {
				title: "Habits",
				habits: habitsWithStatus,
			});
		} catch (err) {
			return res.status(err.cause || 500).json({
				success: false,
				message: err.message || "Internal server error",
			});
		}
	})
	.post(async (req, res) => {
		try {
			const newHabit = await createHabit(req.session.user._id, req.body);

			// TODO: redirect to same page or to /:id
			return res.status(201).json({ success: true, habit: newHabit });
		} catch (err) {
			if (err instanceof z.ZodError) {
				return res.status(400).render("habits/allHabits", {
					title: "Habits",
					success: false,
					errors: err.errors,
				});
			} else {
				return res.status(err.cause || 500).render("habits/allHabits", {
					title: "Habits",
					success: false,
					message: err.message || "Internal server error",
				});
			}
		}
	});

// TODO: add templates and routes for creating new habit

// TODO: add templates for updating habit
router
	.route("/:id")
	.get(async (req, res) => {
		try {
			const habit = await getHabitById(req.params.id, req.session.user._id);
			const canComplete = await canMarkComplete(habit, req.session.user._id);

			return res.render("habits/habit", {
				title: `${habit.name} ${habit.streak}🔥`,
				habit,
				canComplete,
			});
		} catch (err) {
			if (err instanceof z.ZodError) {
				return res.status(400).json({
					success: false,
					errors: err.errors,
				});
			} else {
				return res.status(err.cause || 500).json({
					success: false,
					message: err.message || "Internal server error",
				});
			}
		}
	})
	.put(async (req, res) => {
		try {
			const updatedHabit = await updateHabit(
				req.params.id,
				req.session.user._id,
				req.body
			);

			return res.json({
				success: true,
				habit: updatedHabit,
			});
		} catch (err) {
			if (err instanceof z.ZodError) {
				return res.status(400).json({
					success: false,
					errors: err.errors,
				});
			} else {
				return res.status(err.cause || 500).json({
					success: false,
					message: err.message || "Internal server error",
				});
			}
		}
	});

router.route("/:id/stats").get(async (req, res) => {
	try {
		const habit = await getHabitById(req.params.id, req.session.user._id);
		const stats = await getHabitStats(req.params.id, req.session.user._id);

		return res.render("habits/stats", {
			title: `${habit.name} - Stats`,
			habit,
			stats,
		});
	} catch (err) {
		return res.status(err.cause || 500).render("error", {
			title: "Error",
			error: err.message || "Internal server error",
		});
	}
});

export default router;
