import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../middlewares/auth.js";
import {
	createHabit,
	getUserHabits,
	getHabitById,
	updateHabit,
	getHabitDetails,
} from "../data/habits.js";
import { getHabitStats } from "../data/stats.js";
import { canMarkComplete } from "../helpers.js";

const router = Router();

router.use(requireAuth);

router.route("/").get(async (req, res) => {
	try {
		// TODO: validate query status, and redirect to proper query status page
		const [activeHabits, inactiveHabits] = await Promise.all([
			getUserHabits(req.session.user._id, "active"),
			getUserHabits(req.session.user._id, "inactive"),
		]);

		const activeHabitsWithStatus = await Promise.all(
			activeHabits.map(async (habit) => ({
				...habit,
				canComplete: await canMarkComplete(habit, req.session.user._id),
			}))
		);

		return res.render("habits/allHabits", {
			title: "Your Habits",
			activeHabits: activeHabitsWithStatus,
			inactiveHabits,
		});
	} catch (err) {
		return res.status(err.cause || 500).render("error", {
			title: "Error",
			code: err.cause || 500,
			message: err.message || "Internal server error",
		});
	}
});

router
	.route("/new")
	.get(async (req, res) => {
		return res.render("habits/new", {
			title: "Create a new habit",
			formData: {},
			errors: [],
		});
	})
	.post(async (req, res) => {
		try {
			const newHabit = await createHabit(req.session.user._id, req.body);

			// clear any stored form data
			delete req.session.formData;
			delete req.session.errors;

			return res.redirect(`/habits/${newHabit._id}`);
		} catch (err) {
			// Store the form data to repopulate the form
			req.session.formData = req.body;

			if (err instanceof z.ZodError) {
				req.session.errors = err.errors;

				return res.status(400).render("habits/new", {
					title: "Create New Habit",
					formData: req.body,
					errors: err.errors,
				});
			} else {
				req.session.errors = [
					{
						message: err.message || "Failed to create habit",
					},
				];

				return res.status(err.cause || 500).render("habits/new", {
					title: "Create New Habit",
					formData: req.body,
					errors: [
						{
							message: err.message || "Failed to create habit",
						},
					],
				});
			}
		}
	});

// TODO: add templates for updating habit
router
	.route("/:id")
	.get(async (req, res) => {
		try {
			const habit = await getHabitDetails(req.params.id, req.session.user._id);

			return res.render("habits/habit", {
				title: `${habit.name} ${habit.streak}🔥`,
				habit,
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
