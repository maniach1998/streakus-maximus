import { Router } from "express";
import { z } from "zod";
import { createObjectCsvStringifier } from "csv-writer";

import { requireAuth } from "../../middlewares/auth.js";
import {
	deactivateHabit,
	getHabitById,
	getHabitExportData,
	reactivateHabit,
	updateHabitReminder,
} from "../../data/habits.js";
import {
	markHabitComplete,
	getHabitCompletions,
} from "../../data/completions.js";
import { habitIdSchema } from "../../schemas/habits.js";
import reminderService from "../../services/reminderService.js";

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

router.route("/:id/export").get(async (req, res) => {
	try {
		const validatedId = habitIdSchema.parse({ _id: req.params.id });
		const habitData = await getHabitExportData(
			validatedId._id,
			req.session.user._id
		);

		// I'm manually separating the habit details from the completions,
		// because the data with header rows is not as efficient looking
		// (every row had the same habit details, apart from the respective date and time for each completion)
		// and its not as easy to read
		// (and I'm lazy)
		let csvContent = "HABIT DETAILS\n";
		csvContent += `Name,${habitData.name}\n`;
		csvContent += `Description,${habitData.description}\n`;
		csvContent += `Frequency,${habitData.frequency}\n`;
		csvContent += `Status,${habitData.status}\n`;
		csvContent += `Current Streak,${habitData.currentStreak}\n`;
		csvContent += `Total Completions,${habitData.totalCompletions}\n`;
		csvContent += `Created At,${new Date(
			habitData.createdAt
		).toLocaleDateString()}\n\n`;

		csvContent += "COMPLETION HISTORY\n";
		csvContent += "Date,Time\n";

		habitData.completions.forEach((comp) => {
			csvContent += `${new Date(comp.date).toLocaleDateString()},${
				comp.time
			}\n`;
		});

		// set headers to download the file
		res.setHeader("Content-Type", "text/csv");
		res.setHeader(
			"Content-Disposition",
			`attachment; filename="${habitData.name.replace(
				/[^a-z0-9]/gi,
				"_"
			)}_data.csv"`
		);

		return res.send(csvContent);
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

router.route("/:id/reminder").put(async (req, res) => {
	try {
		const validatedId = habitIdSchema.parse({ _id: req.params.id });

		const habit = await getHabitById(validatedId._id, req.session.user._id);
		if (!habit) {
			throw new Error("Habit not found!", { cause: 404 });
		}

		if (!habit.reminder) {
			throw new Error("No reminder exists for this habit!", { cause: 400 });
		}

		const status = z.enum(["active", "inactive"]).parse(req.body.status);
		const updatedHabit = await updateHabitReminder(
			validatedId._id,
			req.session.user._id,
			{
				...habit.reminder,
				status,
			}
		);

		if (status === "active") {
			await reminderService.scheduleReminder(updatedHabit, req.session.user);
		} else {
			reminderService.cancelReminder(updatedHabit._id.toString());
		}

		res.json({
			success: true,
			message: `Reminder ${
				status === "active" ? "activated" : "deactivated"
			} successfully`,
			habit: updatedHabit,
		});
	} catch (error) {
		if (error instanceof z.ZodError) {
			return res.status(400).json({
				success: false,
				message: "Invalid input data",
				errors: error.errors,
			});
		}

		res.status(error.cause || 500).json({
			success: false,
			message: error.message || "Internal server error",
		});
	}
});

export default router;
