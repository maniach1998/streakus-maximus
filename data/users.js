import { ObjectId } from "mongodb";
import dayjs from "dayjs";
import bcrypt from "bcrypt";
import crypto from "crypto";

import {
	userIdSchema,
	userEmailSchema,
	userSchema,
	loginSchema,
	userSettingsSchema,
	verificationTokenSchema,
} from "../schemas/users.js";
import { users, habits, completions } from "../config/collections.js";
import transporter from "../config/nodemailer.js";

import { calculateAllStreaks } from "../helpers.js";

const generateVerificationToken = () => {
	return crypto.randomBytes(32).toString("hex");
};

export const createUser = async (data) => {
	const validatedData = userSchema.parse(data);
	const usersCollection = await users();

	// check if user already exists
	const userExists = await usersCollection.findOne({
		email: validatedData.email,
	});
	if (userExists)
		throw new Error("An account with this email already exists!", {
			cause: 409,
		});

	// hash the password
	const salt = await bcrypt.genSalt(12);
	const hashedPassword = await bcrypt.hash(validatedData.password, salt);

	const newUser = {
		...validatedData,
		password: hashedPassword,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	// add user to database
	const response = await usersCollection.insertOne(newUser);
	if (response.acknowledged !== true)
		throw new Error("Something went wrong!", { cause: 500 });

	const cleanedUser = {
		_id: response.insertedId,
		email: newUser.email,
		firstName: newUser.firstName,
		lastName: newUser.lastName,
	};

	return { registered: true, user: cleanedUser };
};

export const findUserByEmail = async (email) => {
	const validatedData = userEmailSchema.parse({ email });
	const usersCollection = await users();

	const userExists = await usersCollection.findOne(
		{ email: validatedData.email },
		{ projection: { password: 0 } }
	);
	if (!userExists) throw new Error("This user doesn't exist!", { cause: 404 });

	return userExists;
};

export const loginUser = async (data) => {
	const validatedData = loginSchema.parse(data);
	const usersCollection = await users();

	// find if the user exists
	const user = await usersCollection.findOne({ email: validatedData.email });
	if (!user) throw new Error("Incorrect email or password!", { cause: 404 });

	const confirmPassword = await bcrypt.compare(
		validatedData.password,
		user.password
	);
	if (!confirmPassword)
		throw new Error("Incorrect email or password!", { cause: 404 });

	delete user.password;

	return user;
};

export const updateUser = async (userId, data) => {
	const validatedId = userIdSchema.parse({ _id: userId });
	const validatedData = userSettingsSchema.parse(data);
	const usersCollection = await users();

	// update the user if they exist
	const updatedUser = await usersCollection.findOneAndUpdate(
		{ _id: ObjectId.createFromHexString(validatedId._id) },
		{ $set: { ...validatedData, updatedAt: new Date().toISOString() } },
		{ returnDocument: "after" }
	);
	if (!updatedUser) throw new Error("This user doesn't exist!", { cause: 404 });

	delete updatedUser.password;
	return { updated: true, user: updatedUser };
};

export const sendVerificationEmail = async (user) => {
	const verificationToken = generateVerificationToken();
	const verificationExpires = dayjs().add(24, "hour").toDate();

	const usersCollection = await users();
	await usersCollection.updateOne(
		{ _id: user._id },
		{ $set: { verificationToken, verificationExpires } }
	);

	const verificationLink = `${process.env.APP_URL}/auth/verify-email/${verificationToken}`;
	const mailOptions = {
		from: process.env.EMAIL_USER,
		to: user.email,
		subject: "Verify your email address | Streakus Maximus",
		html: `
			<h1>Welcome to Streakus Maximus!</h1>
			<p>Hi ${user.firstName},</p>
			<p>Thank you for signing up with Streakus Maximus! To get started, please verify your email address by clicking the link below:</p>
			
			<a href="${verificationLink}">Verify Email</a>
			<p>This link will expire in 24 hours.</p>

			<p>If you did not sign up for an account, please ignore this email.</p>
		`,
	};

	try {
		await transporter.sendMail(mailOptions);
		return true;
	} catch (error) {
		console.error("Error sending email: ", error);
		throw new Error("Failed to send verification email!", { cause: 500 });
	}
};

export const resendVerificationEmail = async (userId) => {
	const validatedId = userIdSchema.parse({ _id: userId });
	const usersCollection = await users();

	const user = await usersCollection.findOne({
		_id: ObjectId.createFromHexString(validatedId._id),
	});
	if (!user) throw new Error("This user doesn't exist!", { cause: 404 });

	if (user.isVerified) {
		throw new Error("Email already verified!", { cause: 400 });
	}

	await sendVerificationEmail(user);
};

export const verifyEmail = async (token) => {
	const validatedToken = verificationTokenSchema.parse({ token });

	const usersCollection = await users();
	const user = await usersCollection.findOne({
		verificationToken: validatedToken.token,
		verificationExpires: { $gt: new Date() },
	});

	if (!user)
		throw new Error("Invalid or expired verification token!", { cause: 400 });

	await usersCollection.updateOne(
		{ _id: user._id },
		{
			$set: { isVerified: true },
			$unset: { verificationToken: "", verificationExpires: "" },
		}
	);

	delete user.password;
	return user;
};

export const getUserProfile = async (userId) => {
	const usersCollection = await users();
	const habitsCollection = await habits();
	const completionsCollection = await completions();

	// validate userId and make sure user exists
	const validatedId = userIdSchema.parse({ _id: userId });
	const user = await usersCollection.findOne(
		{
			_id: ObjectId.createFromHexString(validatedId._id),
		},
		{
			projection: {
				password: 0,
			},
		}
	);
	if (!user) throw new Error("This user doesn't exist!", { cause: 404 });

	const [userHabits, allCompletions] = await Promise.all([
		habitsCollection
			.find({ userId: ObjectId.createFromHexString(validatedId._id) })
			.toArray(),
		completionsCollection
			.find({ userId: ObjectId.createFromHexString(validatedId._id) })
			.toArray(),
	]);

	// gather habit IDs
	const habitsMap = userHabits.reduce((map, habit) => {
		map[habit._id.toString()] = {
			_id: habit._id,
			name: habit.name,
		};
		return map;
	}, {});

	// calculate stats
	const completionsByHabit = userHabits.map((habit) => {
		const habitCompletions = allCompletions.filter(
			(comp) => comp.habitId.toString() === habit._id.toString()
		);

		return {
			habit,
			streaks: calculateAllStreaks(habitCompletions, habit.frequency),
		};
	});

	const allTimeStreak = Math.max(
		...completionsByHabit.map(
			({ streaks }) => streaks.longestStreak.duration || 0
		),
		0
	);

	const longestActiveHabits = completionsByHabit
		.filter(({ habit }) => habit.status === "active")
		.filter(({ streaks }) =>
			streaks.allStreaks.find((streak) => streak.isActive)
		)
		.sort((a, b) => b.habit.streak - a.habit.streak);

	const longestActiveStreak = Math.max(
		longestActiveHabits.length > 0 ? longestActiveHabits[0].habit.streak : 0,
		0
	);

	const habitTypes = {
		daily: userHabits.filter((habit) => habit.frequency === "daily").length,
		weekly: userHabits.filter((habit) => habit.frequency === "weekly").length,
		monthly: userHabits.filter((habit) => habit.frequency === "monthly").length,
	};
	const recentActivity = allCompletions
		.sort((a, b) => dayjs(b.date) - dayjs(a.date))
		.slice(0, 5)
		.map((comp) => ({
			habitId: comp.habitId,
			name: habitsMap[comp.habitId.toString()].name,
			date: comp.date,
			time: comp.time,
		}))
		.filter((comp) => comp.name);

	const stats = {
		totalHabits: userHabits.length,
		activeHabits: userHabits.filter((habit) => habit.status === "active")
			.length,
		totalCompletions: allCompletions.length,
		allTimeLongestStreak: allTimeStreak,
		longestActiveStreak,
		memberSince: dayjs(user.createdAt).format("MMMM D, YYYY"),
		daysAsMember: dayjs().diff(dayjs(user.createdAt), "day"),
		habitTypes,
		recentActivity,
	};

	// placeholder for now :)
	const achievements = {
		earned: [],
		progress: [],
	};

	return { user, stats, achievements };
};
