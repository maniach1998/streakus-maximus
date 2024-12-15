import { Router } from "express";
import { z } from "zod";

import {
	loginSchema,
	userSchema,
	verificationTokenSchema,
} from "../schemas/users.js";
import {
	createUser,
	loginUser,
	sendVerificationEmail,
	verifyEmail,
} from "../data/users.js";

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

			const { registered, user } = await createUser(validatedData);

			if (registered) {
				req.session.isNewUser = registered;
				req.session.newUser = user;

				// send verification email
				await sendVerificationEmail(user);

				return res.redirect("/auth/login");
			} else {
				return res.status(500).render("auth/signup", {
					title: "Sign Up",
					error: { general: "Internal server error" },
					...req.body,
				});
			}
		} catch (err) {
			if (err instanceof z.ZodError) {
				const errors = {};

				err.errors.forEach((error) => {
					errors[error.path[0]] = error.message;
				});

				return res.status(400).render("auth/signup", {
					title: "Sign Up",
					error: errors,
					...req.body,
				});
			} else {
				return res.status(err.cause || 500).render("auth/signup", {
					title: "Sign Up",
					error: { general: err.message || "Internal server error" },
					...req.body,
				});
			}
		}
	});

router
	.route("/login")
	.get(async (req, res) => {
		const isAuthenticated = req.session.isAuthenticated;
		if (isAuthenticated) return res.redirect("/dashboard");

		const isNewUser = req.session.isNewUser;
		const newUser = req.session.newUser;
		const wasUnauthorized = req.session.wasUnauthorized;

		// clear session data
		delete req.session.isNewUser;
		delete req.session.newUser;
		delete req.session.wasUnauthorized;

		return res
			.status(wasUnauthorized ? 401 : 200)
			.render("auth/login", { title: "Log in", isNewUser, newUser });
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
				const errors = {};

				err.errors.forEach((error) => {
					errors[error.path[0]] = error.message;
				});

				return res.status(400).render("auth/login", {
					title: "Log in",
					error: errors,
					...req.body,
				});
			} else {
				return res.status(err.cause || 500).render("auth/login", {
					title: "Log in",
					error: { general: err.message || "Internal server error" },
					...req.body,
				});
			}
		}
	});

router.route("/verify-email/:token").get(async (req, res) => {
	try {
		const validatedToken = verificationTokenSchema.parse({
			token: req.params.token,
		});
		const user = await verifyEmail(validatedToken.token);

		// update session if already logged in
		if (
			req.session.isAuthenticated &&
			req.session.user._id === user._id.toString()
		) {
			req.session.user.isVerified = true;
		}

		return res.render("auth/verify-success", {
			title: "Email verified",
			user,
		});
	} catch (err) {
		if (err instanceof z.ZodError) {
			const errors = {};

			err.errors.forEach((error) => {
				errors[error.path[0]] = error.message;
			});

			return res.status(400).render("auth/verify-error", {
				title: "Verification failed",
				error: errors,
			});
		} else {
			return res.status(err.cause || 500).render("auth/verify-error", {
				title: "Verification failed",
				error: { general: err.message || "Internal server error" },
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
