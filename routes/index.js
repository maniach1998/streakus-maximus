import landingRoutes from "./landing.js";
import userRoutes from "./users.js";

export default (app) => {
	app.use("/", landingRoutes);
	app.use("/auth", userRoutes);

	app.use("*", async (req, res) => {
		return res.status(404).send({ error: "Not found! ⛔" });
	});
};
