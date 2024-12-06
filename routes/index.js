import landingRoutes from "./landing.js";
import userRoutes from "./users.js";
import dashboardRoutes from "./dashboard.js";
import habitRoutes from "./habits.js";

export default (app) => {
	app.use("/", landingRoutes);
	app.use("/auth", userRoutes);
	app.use("/dashboard", dashboardRoutes);

	app.use("/habits", habitRoutes);

	app.use("*", async (req, res) => {
		return res.status(404).send({ error: "Not found! ⛔" });
	});
};
