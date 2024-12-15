import { Router } from "express";
import { resendVerificationEmail } from "../../data/users.js";
import { requireAuth } from "../../middlewares/auth.js";

const router = Router();

router.use(requireAuth);

router.route("/resend-verification").post(async (req, res) => {
	try {
		if (req.session.user.isVerified) {
			return res.status(400).json({
				success: false,
				message: "Email already verified!",
			});
		}

		await resendVerificationEmail(req.session.user._id);

		return res.json({
			success: true,
			message: "Verification email sent!",
		});
	} catch (err) {
		return res.status(err.cause || 500).json({
			success: false,
			message: err.message || "Failed to send verification email",
		});
	}
});

export default router;
