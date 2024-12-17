import { Router } from "express";
import { z } from "zod";

import { findUserByEmail, getUserProfile, updateUser } from "../data/users.js";
import { requireAuth } from "../middlewares/auth.js";
import { userSettingsSchema } from "../schemas/users.js";

const router = Router();

router.use(requireAuth);

router.route("/profile").get(async (req, res) => {
	try {
		const data = await getUserProfile(req.session.user._id);

		return res.render("profile/profile", {
			title: "Your Profile | Streakus Maximus",
			...data,
		});
	} catch (err) {
		return res.status(err.cause || 500).render("error", {
			title: "Error | Streakus Maximus",
			code: err.cause || 500,
			message: err.message || "Failed to load profile",
		});
	}
});

router
	.route("/settings")
	.get(async (req, res) => {
		try {
			const user = await findUserByEmail(req.session.user.email);
			const wasUpdated = req.session.wasUpdated;

			delete req.session.wasUpdated;

			return res.render("profile/settings", {
				title: "Settings | Streakus Maximus",
				user,
				wasUpdated,
			});
		} catch (err) {
			return res.status(err.cause || 500).render("error", {
				title: "Error | Streakus Maximus",
				code: err.cause || 500,
				message: err.message || "Failed to load settings",
			});
		}
	})
	.put(async (req, res) => {
		try {
			const validatedData = userSettingsSchema.parse({
				...req.body,
				emailPreferences: {
					achievements: req.body["emailPreferences.achievements"] === "on",
					habitReminders: req.body["emailPreferences.habitReminders"] === "on",
					streakAlerts: req.body["emailPreferences.streakAlerts"] === "on",
				},
			});

			const { updated, user } = await updateUser(
				req.session.user._id,
				validatedData
			);

			if (updated) {
				req.session.wasUpdated = updated;
				// update the user in the session
				req.session.user = user;

				return res.redirect("/settings");
			} else {
				return res.status(500).render("profile/settings", {
					title: "Settings | Streakus Maximus",
					error: { general: "Internal server error" },
					user: { ...req.body },
				});
			}
		} catch (err) {
			const sessionUser = req.session.user;

			if (err instanceof z.ZodError) {
				const errors = {};

				err.errors.forEach((error) => {
					errors[error.path[0]] = error.message;
				});

				return res.status(400).render("profile/settings", {
					title: "Settings | Streakus Maximus",
					user: {
						...req.body,
						email: sessionUser.email,
						emailPreferences: {
							achievements: req.body["emailPreferences.achievements"] === "on",
							habitReminders:
								req.body["emailPreferences.habitReminders"] === "on",
							streakAlerts: req.body["emailPreferences.streakAlerts"] === "on",
						},
					},
					error: errors,
				});
			} else {
				return res.status(err.cause || 500).render("profile/settings", {
					title: "Settings | Streakus Maximus",
					user: {
						...req.body,
						email: sessionUser.email,
						emailPreferences: {
							achievements: req.body["emailPreferences.achievements"] === "on",
							habitReminders:
								req.body["emailPreferences.habitReminders"] === "on",
							streakAlerts: req.body["emailPreferences.streakAlerts"] === "on",
						},
					},
					error: { general: err.message || "Internal server error" },
				});
			}
		}
	});

export default router;
