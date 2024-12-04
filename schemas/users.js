import { z } from "zod";
import { ObjectId } from "mongodb";

export const userSchema = z.object({
	firstName: z
		.string()
		.refine((name) => name.trim().length > 2, {
			message: "First name cannot be less than 2 characters long!",
		})
		.refine((name) => /[a-zA-z]/.test(name), {
			message: "First name can only be alphabets!",
		})
		.transform((name) => name.trim()),
	lastName: z
		.string()
		.refine((name) => name.trim().length > 2, {
			message: "First name cannot be less than 2 characters long!",
		})
		.transform((name) => name.trim()),
	email: z.string().email(),
	password: z
		.string()
		.refine((password) => password.trim().length > 8, {
			message: "Password should be more than 8 characters long!",
		})
		.transform((password) => password.trim()),
});

export const loginSchema = z.object({
	email: z.string().email(),
	password: z
		.string()
		.refine((password) => password.trim().length > 8, {
			message: "Password should be more than 8 characters long!",
		})
		.transform((password) => password.trim()),
});

export const userIdSchema = z.object({
	_id: z
		.string()
		.refine((id) => ObjectId.isValid(id), { message: "Not a valid ObjectId!" }),
});

export const userEmailSchema = z.object({
	email: z.string().email(),
});
