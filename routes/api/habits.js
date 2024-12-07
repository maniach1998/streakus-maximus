import { Router } from "express";
import { z } from "zod";

import { requireAuth } from "../../middlewares/auth.js";
import { deactivateHabit, reactivateHabit } from "../../data/habits.js";
import {
	markHabitComplete,
	getHabitCompletions,
} from "../../data/completions.js";

const router = Router();

router.use(requireAuth);

router.route("/:id/complete").post(async (req, res) => {
	try {
		const { completion, habit } = await markHabitComplete(
			req.params.id,
			req.session.user._id
		);

		return res.json({ success: true, completion, habit });
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

router.route("/:id/deactivate").post(async (req, res) => {
	try {
		const habit = await deactivateHabit(req.params.id, req.session.user._id);

		return res.json({ success: true, habit });
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

router.route("/:id/reactivate").post(async (req, res) => {
	try {
		const habit = await reactivateHabit(req.params.id, req.session.user._id);

		return res.json({ success: true, habit });
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

export default router;
