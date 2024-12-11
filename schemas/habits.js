import { z } from "zod";
import { ObjectId } from "mongodb";

const HabitStatus = {
	ACTIVE: "active",
	INACTIVE: "inactive",
};

export const habitSchema = z
	.object({
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
	})
	.required("All fields are required!");

export const habitIdSchema = z.object({
	_id: z
		.string()
		.transform((id) => id.trim())
		.refine((id) => ObjectId.isValid(id), { message: "Not a valid ObjectId!" }),
});

export const updateHabitSchema = habitSchema.partial();

export const habitStatusSchema = z.enum([
	HabitStatus.ACTIVE,
	HabitStatus.INACTIVE,
]);
