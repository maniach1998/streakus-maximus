import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
	host: "smtp.sendgrid.net",
	port: 587,
	auth: {
		user: "apikey",
		pass: process.env.EMAIL_API_KEY,
	},
});

export default transporter;
