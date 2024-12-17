import { z } from "zod";
import { ObjectId } from "mongodb";
import xss from "xss";

const sanitize = (input) =>
	xss(input, {
		whiteList: {},
		stripIgnoreTag: true,
		stripIgnoreTagBody: ["script"],
	});

export const userSchema = z
	.object({
		firstName: z
			.string()
			.transform((name) => name.trim())
			.refine((name) => name.length > 2, {
				message: "First name cannot be less than 2 characters long!",
			})
			.refine((name) => /^[a-zA-z]+$/.test(name), {
				message: "First name can only contain alphabets!",
			})
			.transform(sanitize),
		lastName: z
			.string()
			.transform((name) => name.trim())
			.refine((name) => name.length > 2, {
				message: "Last name cannot be less than 2 characters long!",
			})
			.refine((name) => /^[a-zA-z]+$/.test(name), {
				message: "Last name can only contain alphabets!",
			})
			.transform(sanitize),
		email: z.string().email().transform(sanitize),
		password: z
			.string()
			.transform((password) => password.trim())
			.refine((password) => password.length > 8, {
				message: "Password should be more than 8 characters long!",
			})
			.transform(sanitize),
		isVerified: z.boolean().default(false),
		verificationToken: z.string().optional(),
		verificationExpires: z.date().optional(),
		emailPreferences: z
			.object({
				achievements: z.boolean().default(false),
				habitReminders: z.boolean().default(false),
				streakAlert: z.boolean().default(false),
			})
			.default({}),
	})
	.required("All fields are required!");

export const loginSchema = z
	.object({
		email: z.string().email().transform(sanitize),
		password: z
			.string()
			.transform((password) => password.trim())
			.refine((password) => password.length > 8, {
				message: "Password should be more than 8 characters long!",
			})
			.transform(sanitize),
	})
	.required("All fields are required!");

export const userIdSchema = z.object({
	_id: z
		.string()
		.transform((id) => id.trim())
		.refine((id) => ObjectId.isValid(id), { message: "Not a valid ObjectId!" })
		.transform(sanitize),
});

export const userEmailSchema = z.object({
	email: z.string().email().transform(sanitize),
});

export const userSettingsSchema = z.object({
	firstName: userSchema.shape.firstName,
	lastName: userSchema.shape.lastName,
	emailPreferences: z
		.object({
			achievements: z.boolean().default(false),
			habitReminders: z.boolean().default(false),
			streakAlerts: z.boolean().default(false),
		})
		.default({}),
});

export const verificationTokenSchema = z.object({
	token: z
		.string()
		.transform((token) => token.trim())
		.refine((token) => token.length > 0, {
			message: "Verification token is required!",
		})
		.transform(sanitize),
});
