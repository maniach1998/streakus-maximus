import express from "express";
import handlebars from "express-handlebars";

import configRoutes from "./routes/index.js";

const app = express();
const PORT = 3000;

// handlebars setup
app.engine("handlebars", handlebars.engine({ defaultLayout: "main" }));
app.set("view engine", "handlebars");
app.set("views", "./views");

// app setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

configRoutes(app);

app.listen(PORT, () => {
	console.log(`Woohoo! Server running at http://localhost:${PORT} 🙌`);
});
