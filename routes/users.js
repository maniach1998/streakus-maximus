import { Router } from "express";
import { z } from "zod";

import { loginSchema, userSchema } from "../schemas/users.js";
import { createUser, loginUser } from "../data/users.js";

const router = Router();

router
	.route("/sign-up")
	.get(async (req, res) => {
		const isAuthenticated = req.session.isAuthenticated;
		if (isAuthenticated) return res.redirect("/dashboard");

		return res.render("auth/signup", { title: "Sign Up" });
	})
	.post(async (req, res) => {
		try {
			const validatedData = userSchema.parse(req.body);

			const newUser = await createUser(validatedData);

			// TODO: redirect to login page/setup token and redirect to dash
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
		const isAuthenticated = req.session.isAuthenticated;
		if (isAuthenticated) return res.redirect("/dashboard");

		return res.render("auth/login", { title: "Log in" });
	})
	.post(async (req, res) => {
		try {
			const validatedData = loginSchema.parse(req.body);

			const user = await loginUser(validatedData);

			// setup session
			req.session.user = user;
			req.session.isAuthenticated = true;

			return res.redirect("/dashboard");
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

router.route("/logout").get(async (req, res) => {
	req.session.destroy((err) => {
		if (err) {
			console.error("Error destroying session", err);
			return res.status(500).json({
				success: false,
				message: "Error logging out",
			});
		}
		res.clearCookie("StreakusMaximus");
		res.redirect("/auth/login");
	});
});

export default router;
