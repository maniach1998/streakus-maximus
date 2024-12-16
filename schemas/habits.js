import { z } from "zod";
import { ObjectId } from "mongodb";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat.js";

dayjs.extend(customParseFormat);

const HabitStatus = {
	ACTIVE: "active",
	INACTIVE: "inactive",
};

const baseHabitFields = {
	name: z
		.string()
		.transform((name) => name.trim())
		.refine((name) => name.length >= 3, {
			message: "Habit name must be at least 3 characters long!",
		}),
	description: z
		.string()
		.transform((desc) => desc.trim())
		.refine((desc) => desc.length >= 10, {
			message: "Description must be at least 10 characters long",
		}),
	frequency: z.enum(["daily", "weekly", "monthly"], {
		message: "Frequency must be either 'daily', 'weekly', or 'monthly'",
	}),
};

export const reminderSchema = z.object({
	time: z
		.string()
		.transform((time) => time.trim())
		.refine((time) => time.length > 0, {
			message: "Reminder time is required!",
		})
		.refine(
			(time) =>
				dayjs(time, "hh:mm A").isValid() || dayjs(time, "HH:mm").isValid(),
			{
				message: "Time must be in HH:mm or hh:mm AM/PM format.",
			}
		),
	status: z
		.enum(["active", "inactive"], {
			message: "Status must be either 'active' or 'inactive'",
		})
		.default("active"),
});

export const habitSchema = z
	.object({
		...baseHabitFields,
		reminderTime: z
			.string()
			.transform((time) => time.trim())
			.optional(),
	})
	.required("All fields are required!")
	.transform((data) => {
		if (data.reminderTime) {
			const parsedTime = dayjs(data.reminderTime, ["HH:mm", "hh:mm A"], true);

			if (!parsedTime.isValid()) {
				throw new Error("Invalid reminder time format!");
			}

			const reminder = reminderSchema.parse({
				time: parsedTime.format("hh:mm A"),
				status: "active",
			});

			return {
				...data,
				reminder,
				reminderTime: undefined,
			};
		}

		const { reminderTime, ...rest } = data;
		return rest;
	});

export const habitIdSchema = z.object({
	_id: z
		.string()
		.transform((id) => id.trim())
		.refine((id) => ObjectId.isValid(id), { message: "Not a valid ObjectId!" }),
});

export const editHabitSchema = z
	.object({
		...baseHabitFields,
		status: z.enum(["active", "inactive"], {
			errorMap: () => ({
				message: "Status must be either 'active' or 'inactive'",
			}),
		}),
		reminderTime: z
			.string()
			.transform((time) => time.trim())
			.optional(),
	})
	.required("All fields are required!")
	.transform((data) => {
		if (data.reminderTime) {
			const parsedTime = dayjs(data.reminderTime, ["HH:mm", "hh:mm A"], true);

			if (!parsedTime.isValid()) {
				throw new Error("Invalid reminder time format!");
			}

			const reminder = reminderSchema.parse({
				time: parsedTime.format("hh:mm A"),
				status: "active",
			});

			return {
				...data,
				reminder,
				reminderTime: undefined,
			};
		}

		const { reminderTime, ...rest } = data;
		return rest;
	});

export const updateHabitSchema = z
	.object({
		...Object.entries(baseHabitFields).reduce(
			(acc, [key, schema]) => ({
				...acc,
				[key]: schema.optional(),
			}),
			{}
		),
		reminderTime: z
			.string()
			.transform((time) => time.trim())
			.optional(),
	})
	.transform((data) => {
		if (data.reminderTime) {
			const parsedTime = dayjs(data.reminderTime, ["HH:mm", "hh:mm A"], true);

			if (!parsedTime.isValid()) {
				throw new Error("Invalid reminder time format!");
			}

			const reminder = reminderSchema.parse({
				time: parsedTime.format("hh:mm A"),
				status: "active",
			});

			return {
				...data,
				reminder,
				reminderTime: undefined,
			};
		}

		const { reminderTime, ...rest } = data;
		return rest;
	});

export const habitStatusSchema = z.enum([
	HabitStatus.ACTIVE,
	HabitStatus.INACTIVE,
]);
