import { Router } from "express";

const router = Router();

router.route("/").get(async (req, res) => {
	return res.render("landing/home", { title: "Streakus Maximus" });
});

export default router;
