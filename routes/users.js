import { Router } from "express";
import { z } from "zod";

import { loginSchema, userSchema } from "../schemas/users.js";
import { createUser, loginUser } from "../data/users.js";

const router = Router();

router
	.route("/sign-up")
	.get(async (req, res) => {
		return res.render("auth/signup", { title: "Sign Up" });
	})
	.post(async (req, res) => {
		try {
			const validatedData = userSchema.parse(req.body);

			const newUser = await createUser(validatedData);

			return res.json({
				success: true,
				user: newUser,
			});
		} catch (err) {
			if (err instanceof z.ZodError) {
				return res
					.status(400)
					.render("auth/signup", { title: "Sign Up", errors: err.errors });
			} else {
				return res.status(err.cause || 500).render("auth/signup", {
					title: "Sign Up",
					rootError: err.message || "Internal server error",
				});
			}
		}
	});

router
	.route("/login")
	.get(async (req, res) => {
		return res.render("auth/login", { title: "Log in" });
	})
	.post(async (req, res) => {
		try {
			const validatedData = loginSchema.parse(req.body);

			const user = await loginUser(validatedData);

			return res.json({
				success: true,
				user,
			});
		} catch (err) {
			if (err instanceof z.ZodError) {
				return res
					.status(400)
					.render("auth/login", { title: "Log in", errors: err.errors });
			} else {
				return res.status(err.cause || 500).render("auth/login", {
					title: "Log in",
					rootError: err.message || "Internal server error",
				});
			}
		}
	});

export default router;
