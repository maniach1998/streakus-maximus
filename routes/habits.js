import { Router } from "express";
import { z } from "zod";

import {
	createHabit,
	getUserHabits,
	getHabitById,
	getHabitDetails,
	editHabit,
	getHabitStreaks,
} from "../data/habits.js";
import { editHabitSchema, habitIdSchema } from "../schemas/habits.js";
import { getHabitCompletions } from "../data/completions.js";
import { getHabitProgress, getHabitStats } from "../data/stats.js";

import { requireAuth } from "../middlewares/auth.js";
import { canMarkComplete } from "../helpers.js";
import reminderService from "../services/reminderService.js";

const router = Router();

router.use(requireAuth);

router.route("/").get(async (req, res) => {
	try {
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
			title: "Your Habits | Streakus Maximus",
			activeHabits: activeHabitsWithStatus,
			inactiveHabits,
		});
	} catch (err) {
		return res.status(err.cause || 500).render("error", {
			title: "Error | Streakus Maximus",
			code: err.cause || 500,
			message: err.message || "Internal server error",
		});
	}
});

router
	.route("/new")
	.get(async (req, res) => {
		return res.render("habits/new", {
			title: "Create a new habit | Streakus Maximus",
			formData: {},
			errors: [],
			isVerified: req.session.user.isVerified,
		});
	})
	.post(async (req, res) => {
		try {
			const habitData = {
				name: req.body.name,
				description: req.body.description,
				frequency: req.body.frequency,
				reminderTime: req.body.reminderTime || req.body["reminder.time"],
			};

			const newHabit = await createHabit(req.session.user._id, habitData);

			if (newHabit.reminder) {
				const user = req.session.user;
				await reminderService.scheduleReminder(newHabit, user);
			}

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
					title: "Create New Habit | Streakus Maximus",
					formData: req.body,
					errors: err.errors,
					isVerified: req.session.user.isVerified,
				});
			} else {
				req.session.errors = [
					{
						message: err.message || "Failed to create habit",
					},
				];

				return res.status(err.cause || 500).render("habits/new", {
					title: "Create New Habit | Streakus Maximus",
					formData: req.body,
					errors: [
						{
							message: err.message || "Failed to create habit",
						},
					],
					isVerified: req.session.user.isVerified,
				});
			}
		}
	});

router.route("/:id").get(async (req, res) => {
	try {
		const validatedId = habitIdSchema.parse({ _id: req.params.id });
		const habit = await getHabitDetails(validatedId._id, req.session.user._id);

		const wasUpdated = req.session.success;
		delete req.session.success;

		return res.render("habits/habit", {
			title: `${habit.name} ${habit.streak}🔥 | Streakus Maximus`,
			habit,
			wasUpdated,
		});
	} catch (err) {
		if (err instanceof z.ZodError) {
			const errors = {};

			err.errors.forEach((error) => {
				errors[error.path[0]] = error.message;
			});

			return res.status(400).render("error", {
				title: "Error | Streakus Maximus",
				code: 400,
				message: "Invalid habit ID",
				errors,
			});
		} else {
			return res.status(err.cause || 500).render("error", {
				title: "Error | Streakus Maximus",
				code: err.cause || 500,
				message: err.message || "Internal server error",
			});
		}
	}
});

router
	.route("/:id/edit")
	.get(async (req, res) => {
		try {
			const validatedId = habitIdSchema.parse({ _id: req.params.id });
			const habit = await getHabitById(validatedId._id, req.session.user._id);

			return res.render("habits/edit", {
				title: `Edit ${habit.name} | Streakus Maximus`,
				habit,
				isVerified: req.session.user.isVerified,
			});
		} catch (err) {
			if (err instanceof z.ZodError) {
				const errors = {};

				err.errors.forEach((error) => {
					errors[error.path[0]] = error.message;
				});

				return res.status(400).render("error", {
					title: "Error | Streakus Maximus",
					code: 400,
					message: "Invalid habit ID",
					errors,
				});
			} else {
				return res.status(err.cause || 500).render("error", {
					title: "Error | Streakus Maximus",
					code: err.cause || 500,
					message: err.message || "Internal server error",
				});
			}
		}
	})
	.put(async (req, res) => {
		try {
			const validatedId = habitIdSchema.parse({ _id: req.params.id });
			const habitData = {
				name: req.body.name,
				description: req.body.description,
				frequency: req.body.frequency,
				status: req.body.status,
				reminderTime: req.body.reminderTime || req.body["reminder.time"],
			};

			const updatedHabit = await editHabit(
				validatedId._id,
				req.session.user._id,
				habitData
			);

			// handle any reminder updates
			if (updatedHabit.reminder && updatedHabit.reminder.status === "active") {
				await reminderService.scheduleReminder(updatedHabit, req.session.user);
			} else {
				reminderService.cancelReminder(updatedHabit._id.toString());
			}

			req.session.success = true;
			return res.redirect(`/habits/${updatedHabit._id}`);
		} catch (err) {
			const _id = req.params.id;

			if (err instanceof z.ZodError) {
				return res.status(400).render("habits/edit", {
					title: "Edit Habit | Streakus Maximus",
					habit: { ...req.body, _id },
					error: err.errors.reduce((acc, curr) => {
						acc[curr.path[0]] = curr.message;
						return acc;
					}, {}),
					isVerified: req.session.user.isVerified,
				});
			} else {
				return res.status(err.cause || 500).render("habits/edit", {
					title: "Edit Habit | Streakus Maximus",
					habit: { ...req.body, _id },
					error: { general: err.message || "Internal server error" },
					isVerified: req.session.user.isVerified,
				});
			}
		}
	});

router.route("/:id/stats").get(async (req, res) => {
	try {
		const validatedId = habitIdSchema.parse({ _id: req.params.id });
		const habit = await getHabitById(validatedId._id, req.session.user._id);
		const stats = await getHabitStats(validatedId._id, req.session.user._id);

		return res.render("habits/stats", {
			title: `${habit.name} - Stats | Streakus Maximus`,
			habit,
			stats,
		});
	} catch (err) {
		if (err instanceof z.ZodError) {
			const errors = {};

			err.errors.forEach((error) => {
				errors[error.path[0]] = error.message;
			});

			return res.status(400).render("error", {
				title: "Error | Streakus Maximus",
				code: 400,
				message: "Invalid habit ID",
				errors,
			});
		} else {
			return res.status(err.cause || 500).render("error", {
				title: "Error | Streakus Maximus",
				code: err.cause || 500,
				message: err.message || "Internal server error",
			});
		}
	}
});

router.route("/:id/streaks").get(async (req, res) => {
	try {
		const validatedId = habitIdSchema.parse({ _id: req.params.id });
		const { habit, allStreaks, longestStreak } = await getHabitStreaks(
			validatedId._id,
			req.session.user._id
		);

		return res.render("habits/streaks", {
			title: `${habit.name} - Streaks | Streakus Maximus`,
			habit,
			allStreaks,
			longestStreak,
		});
	} catch (err) {
		if (err instanceof z.ZodError) {
			const errors = {};

			err.errors.forEach((error) => {
				errors[error.path[0]] = error.message;
			});

			return res.status(400).render("error", {
				title: "Error | Streakus Maximus",
				code: 400,
				message: "Invalid habit ID",
				errors,
			});
		} else {
			return res.status(err.cause || 500).render("error", {
				title: "Error | Streakus Maximus",
				code: err.cause || 500,
				message: err.message || "Internal server error",
			});
		}
	}
});

router.route("/:id/completions").get(async (req, res) => {
	try {
		const validatedId = habitIdSchema.parse({ _id: req.params.id });
		const habit = await getHabitById(validatedId._id, req.session.user._id);
		const completions = await getHabitCompletions(
			validatedId._id,
			req.session.user._id
		);

		return res.render("habits/completions", {
			title: `${habit.name} - Completions | Streakus Maximus`,
			habit,
			completions,
		});
	} catch (err) {
		if (err instanceof z.ZodError) {
			const errors = {};

			err.errors.forEach((error) => {
				errors[error.path[0]] = error.message;
			});

			return res.status(400).render("error", {
				title: "Error | Streakus Maximus",
				code: 400,
				message: "Invalid habit ID",
				errors,
			});
		} else {
			return res.status(err.cause || 500).render("error", {
				title: "Error | Streakus Maximus",
				code: err.cause || 500,
				message: err.message || "Internal server error",
			});
		}
	}
});

router.route("/:id/progress").get(async (req, res) => {
	try {
		const validatedId = habitIdSchema.parse({ _id: req.params.id });
		const timeframe = req.query.timeframe === "year" ? "year" : "month";

		const data = await getHabitProgress(
			validatedId._id,
			req.session.user._id,
			timeframe
		);

		console.log("data: ", {
			calendarData: data.calendarData.length,
			completionRates: data.completionRates,
		});

		return res.render("habits/progress", {
			title: `${data.habit.name} - Progress | Streakus Maximus`,
			...data,
		});
	} catch (err) {
		if (err instanceof z.ZodError) {
			const errors = {};

			err.errors.forEach((error) => {
				errors[error.path[0]] = error.message;
			});

			return res.status(400).render("error", {
				title: "Error | Streakus Maximus",
				code: 400,
				message: "Invalid habit ID",
				errors,
			});
		} else {
			return res.status(err.cause || 500).render("error", {
				title: "Error | Streakus Maximus",
				code: err.cause || 500,
				message: err.message || "Internal server error",
			});
		}
	}
});

export default router;
