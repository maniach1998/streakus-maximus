import express from "express";
import handlebars from "express-handlebars";
import session from "express-session";

import configRoutes from "./routes/index.js";
import { setUserDefaults } from "./middlewares/auth.js";

const app = express();
const PORT = 3000;

// handlebars setup
app.engine(
	"handlebars",
	handlebars.engine({
		defaultLayout: "main",
		extname: ".handlebars",
		partialsDir: ["views/partials"],
	})
);
app.set("view engine", "handlebars");
app.set("views", "./views");

// app setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

// setup session
app.use(
	session({
		name: "StreakusMaximus",
		secret: "very_secret_key_here",
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
