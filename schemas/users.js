import { z } from "zod";
import { ObjectId } from "mongodb";

export const userSchema = z.object({
	firstName: z.string().min(2),
	lastName: z.string().min(2),
	email: z.string().email(),
	password: z.string().min(8),
});

export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(8),
});

export const userIdSchema = z.object({
	_id: z
		.string()
		.refine((id) => ObjectId.isValid(id), { message: "Not a valid ObjectId!" }),
});

export const userEmailSchema = z.object({
	email: z.string().email(),
});
