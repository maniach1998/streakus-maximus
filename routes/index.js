import landingRoutes from "./landing.js";
import authRoutes from "./users.js";
import dashboardRoutes from "./dashboard.js";
import habitRoutes from "./habits.js";
import profileRoutes from "./profile.js";

import apiRoutes from "./api/api.js";

export default (app) => {
	app.use("/", landingRoutes);
	app.use("/auth", authRoutes);
	app.use("/dashboard", dashboardRoutes);
	app.use("/habits", habitRoutes);
	app.use("/", profileRoutes);

	app.use("/api", apiRoutes);

	app.use("*", async (req, res) => {
		return res.status(404).render("error", {
			title: "Not found",
			code: 404,
			message: "Stop ⛔! We couldn't find this page...",
		});
	});
};
