import { z } from "zod";
import { ObjectId } from "mongodb";

export const completionSchema = z
	.object({
		habitId: z
			.string()
			.transform((id) => id.trim())
			.refine((id) => ObjectId.isValid(id), {
				message: "Not a valid ObjectId!",
			}),
		date: z.string().datetime(),
		time: z.string().regex(/^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/, {
			message: "Time must be in format HH:MM AM/PM",
		}),
	})
	.required("All fields are required!");

export const completionIdSchema = z.object({
	_id: z
		.string()
		.transform((id) => id.trim())
		.refine((id) => ObjectId.isValid(id), { message: "Not a valid ObjectId!" }),
});
