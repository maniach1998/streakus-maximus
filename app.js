import express from "express";
import handlebars from "express-handlebars";
import session from "express-session";

import configRoutes from "./routes/index.js";
import { setUserDefaults } from "./middlewares/auth.js";
import { handlebarsHelpers } from "./handlebars.js";
import reminderService from "./services/reminderService.js";

const app = express();
const PORT = process.env.PORT || 3000;
const rewriteUnsupportedBrowserMethods = (req, res, next) => {
	if (req.body && req.body._method) {
		req.method = req.body._method;
		delete req.body._method;
	}

	next();
};

// handlebars setup
app.engine(
	"handlebars",
	handlebars.engine({
		defaultLayout: "main",
		extname: ".handlebars",
		partialsDir: ["views/partials"],
		helpers: handlebarsHelpers,
	})
);
app.set("view engine", "handlebars");
app.set("views", "./views");

// app setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static("public"));
app.use(rewriteUnsupportedBrowserMethods);

// setup session
app.use(
	session({
		name: "StreakusMaximus",
		secret: process.env.SESSION_SECRET,
		resave: false,
		saveUninitialized: false,
		cookie: {
			secure: process.env.NODE_ENV === "production",
			httpOnly: true,
			maxAge: 24 * 60 * 60 * 1000, // 24 hours
		},
	})
);
app.use(setUserDefaults);

configRoutes(app);

app.listen(PORT, () => {
	console.log(`Woohoo! Server running at http://localhost:${PORT} 🙌`);
});

await reminderService.start();

process.on("SIGTERM", async () => {
	reminderService.stop();
	process.exit(0);
});
