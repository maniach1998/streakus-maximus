import homeRoutes from "./home.js";

export default (app) => {
	app.use("/", homeRoutes);

	app.use("*", async (req, res) => {
		return res.status(404).send({ error: "Not found! ⛔" });
	});
};
