import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../middlewares/auth.js";
import {
	createHabit,
	getUserHabits,
	getHabitById,
	updateHabit,
	deactivateHabit,
	reactivateHabit,
} from "../data/habits.js";
import { markHabitComplete, getHabitCompletions } from "../data/completions.js";

const router = Router();

router.use(requireAuth);

router
	.route("/")
	.get(async (req, res) => {
		try {
			// TODO: validate query status, and redirect to proper query status page
			const status = req.query.status || "active";
			const habits = await getUserHabits(req.session.user._id, status);

			return res.render("habits/allHabits", { title: "Habits", habits });
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

router
	.route("/:id")
	.get(async (req, res) => {
		try {
			const habit = await getHabitById(req.params.id, req.session.user._id);

			return res.json({ success: true, habit });
		} catch (err) {
			return res.status(err.cause || 500).json({
				success: false,
				message: err.message || "Internal server error",
			});
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

router.route("/:id/complete").post(async (req, res) => {
	try {
		const { completion, habit } = await markHabitComplete(
			req.params.id,
			req.session.user._id
		);

		return res.json({ success: true, completion });
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

router.route("/:id/completions").get(async (req, res) => {
	try {
		const completions = await getHabitCompletions(
			req.params.id,
			req.session.user._id
		);

		return res.json({ success: true, completions });
	} catch (err) {
		return res.status(err.cause || 500).json({
			success: false,
			message: err.message || "Internal server error",
		});
	}
});

router.route("/:id/deactivate").post(async (req, res) => {
	try {
		const habit = await deactivateHabit(req.params.id, req.session.user._id);

		return res.json({ success: true, habit });
	} catch (err) {
		return res.status(err.cause || 500).json({
			success: false,
			message: err.message || "Internal server error",
		});
	}
});

router.route("/:id/reactivate").post(async (req, res) => {
	try {
		const habit = await reactivateHabit(req.params.id, req.session.user._id);

		return res.json({ success: true, habit });
	} catch (err) {
		return res.status(err.cause || 500).json({
			success: false,
			message: err.message || "Internal server error",
		});
	}
});

export default router;
