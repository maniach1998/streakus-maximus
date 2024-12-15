import { Router } from "express";

const router = Router();

router.route("/").get(async (req, res) => {
	if (req.session.isAuthenticated) return res.redirect("/dashboard");

	return res.render("landing/home", { title: "Streakus Maximus" });
});

export default router;
