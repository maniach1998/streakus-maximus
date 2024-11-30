import homeRoutes from "./home.js";
import userRoutes from "./users.js";

export default (app) => {
	app.use("/", homeRoutes);
	app.use("/auth", userRoutes);

	app.use("*", async (req, res) => {
		return res.status(404).send({ error: "Not found! ⛔" });
	});
};
