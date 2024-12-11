import { ObjectId } from "mongodb";
import dayjs from "dayjs";
import bcrypt from "bcrypt";

import {
	userIdSchema,
	userEmailSchema,
	userSchema,
	loginSchema,
} from "../schemas/users.js";
import { users, habits, completions } from "../config/collections.js";

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
		email: newUser.email,
		firstName: newUser.firstName,
		lastName: newUser.lastName,
	};

	return { registered: true, user: cleanedUser };
};

export const findUserByEmail = async (email) => {
	const validatedData = userEmailSchema.parse({ email });
	const usersCollection = await users();

	// find the user
	const userExists = await usersCollection.findOne({
		email: validatedData.email,
	});
	if (!userExists) throw new Error("User not found!", { cause: 404 });

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

	// calculate stats
	const longestStreak = Math.max(
		...userHabits.map((habit) => habit.streak || 0),
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
		.map((comp) => ({ habitId: comp.habitId, date: comp.date }));

	const stats = {
		totalHabits: userHabits.length,
		activeHabits: userHabits.filter((habit) => habit.status === "active")
			.length,
		totalCompletions: allCompletions.length,
		longestStreak,
		currentTotalStreak: userHabits.reduce(
			(sum, habit) => sum + (habit.streak || 0),
			0
		),
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
