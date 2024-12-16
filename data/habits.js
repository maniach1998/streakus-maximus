import { ObjectId } from "mongodb";

import { completions, habits } from "../config/collections.js";
import {
	habitSchema,
	habitIdSchema,
	updateHabitSchema,
	habitStatusSchema,
	editHabitSchema,
	reminderSchema,
} from "../schemas/habits.js";

import {
	calculateAllStreaks,
	calculateNextAvailable,
	canMarkComplete,
	validateAndUpdateStreak,
} from "../helpers.js";

export const createHabit = async (userId, data) => {
	const validatedData = habitSchema.parse(data);
	const habitsCollection = await habits();

	const newHabit = {
		...validatedData,
		userId: ObjectId.createFromHexString(userId),
		streak: 0,
		totalCompletions: 0,
		status: "active",
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	const response = await habitsCollection.insertOne(newHabit);
	if (!response.acknowledged)
		throw new Error("Failed to create habit!", { cause: 500 });

	return {
		_id: response.insertedId,
		...newHabit,
	};
};

export const updateHabitReminder = async (habitId, userId, reminderData) => {
	const validatedId = habitIdSchema.parse({ _id: habitId });
	const validatedReminder = reminderSchema.parse(reminderData);

	const habitsCollection = await habits();

	const response = await habitsCollection.findOneAndUpdate(
		{
			_id: ObjectId.createFromHexString(validatedId._id),
			userId: ObjectId.createFromHexString(userId),
		},
		{
			$set: {
				reminder: validatedReminder,
				updatedAt: new Date().toISOString(),
			},
		},
		{ returnDocument: "after" }
	);

	if (!response) throw new Error("Habit not found!", { cause: 404 });
	return response;
};

export const getUserHabits = async (userId, status = "active") => {
	const habitsCollection = await habits();

	const query = {
		userId: ObjectId.createFromHexString(userId),
	};

	if (status !== "all") {
		const validatedStatus = habitStatusSchema.parse(status);
		query.status = validatedStatus;
	} else {
		query.status = { $in: ["active", "inactive"] };
	}

	const userHabits = await habitsCollection
		.find(query)
		.sort({ updatedAt: -1 })
		.toArray();

	await Promise.all(
		userHabits.map(async (habit) => {
			habit.streak = await validateAndUpdateStreak(habit, userId);
		})
	);

	return userHabits;
};

export const getHabitById = async (habitId, userId) => {
	const validatedId = habitIdSchema.parse({ _id: habitId });
	const habitsCollection = await habits();

	const habit = await habitsCollection.findOne({
		_id: ObjectId.createFromHexString(validatedId._id),
		userId: ObjectId.createFromHexString(userId),
	});

	if (!habit) throw new Error("Habit not found!", { cause: 404 });

	habit.streak = await validateAndUpdateStreak(habit, userId);

	return habit;
};

export const updateHabit = async (habitId, userId, data) => {
	const validatedId = habitIdSchema.parse({ _id: habitId });
	const validatedData = updateHabitSchema.parse(data);
	const habitsCollection = await habits();

	const updateData = {
		...validatedData,
		updatedAt: new Date().toISOString(),
	};

	const response = await habitsCollection.findOneAndUpdate(
		{
			_id: ObjectId.createFromHexString(validatedId._id),
			userId: ObjectId.createFromHexString(userId),
		},
		{ $set: updateData },
		{ returnDocument: "after" }
	);
	if (!response) throw new Error("Habit not found!", { cause: 404 });

	return response;
};

export const editHabit = async (habitId, userId, data) => {
	const validatedId = habitIdSchema.parse({ _id: habitId });
	const validatedData = editHabitSchema.parse(data);
	const habitsCollection = await habits();

	if (validatedData.status === "inactive" && validatedData.reminder) {
		validatedData.reminder.status = "inactive";
	}

	const response = await habitsCollection.findOneAndUpdate(
		{
			_id: ObjectId.createFromHexString(validatedId._id),
			userId: ObjectId.createFromHexString(userId),
		},
		{ $set: { ...validatedData, updatedAt: new Date().toISOString() } },
		{ returnDocument: "after" }
	);
	if (!response) throw new Error("Habit not found!", { cause: 404 });

	return response;
};

export const deactivateHabit = async (habitId, userId) => {
	const validatedId = habitIdSchema.parse({ _id: habitId });
	const habitsCollection = await habits();

	const response = await habitsCollection.findOneAndUpdate(
		{
			_id: ObjectId.createFromHexString(validatedId._id),
			userId: ObjectId.createFromHexString(userId),
		},
		{
			$set: {
				status: "inactive",
				updatedAt: new Date().toISOString(),
			},
		},
		{ returnDocument: "after" }
	);

	if (!response) throw new Error("Habit not found!", { cause: 404 });

	return response;
};

export const reactivateHabit = async (habitId, userId) => {
	const validatedId = habitIdSchema.parse({ _id: habitId });
	const habitsCollection = await habits();

	const response = await habitsCollection.findOneAndUpdate(
		{
			_id: ObjectId.createFromHexString(validatedId._id),
			userId: ObjectId.createFromHexString(userId),
		},
		{
			$set: {
				status: "active",
				updatedAt: new Date().toISOString(),
			},
		},
		{ returnDocument: "after" }
	);

	if (!response) throw new Error("Habit not found!", { cause: 404 });

	return response;
};

export const getActiveStreaks = async (userId) => {
	const habitsCollection = await habits();

	const activeStreaks = await habitsCollection
		.find({
			userId: ObjectId.createFromHexString(userId),
			status: "active",
			streak: { $gt: 0 },
		})
		.sort({ streak: -1 })
		.project({ _id: 1, name: 1, frequency: 1, streak: 1 })
		.toArray();

	return activeStreaks;
};

export const getHabitStreaks = async (habitId, userId) => {
	const habit = await getHabitById(habitId, userId);

	const completionsCollection = await completions();
	const allCompletions = await completionsCollection
		.find({
			habitId: ObjectId.createFromHexString(habitId),
			userId: ObjectId.createFromHexString(userId),
		})
		.sort({ date: -1 })
		.toArray();

	const { allStreaks, longestStreak } = calculateAllStreaks(
		allCompletions,
		habit.frequency
	);

	return {
		habit,
		allStreaks,
		longestStreak,
	};
};

export const getHabitDetails = async (habitId, userId) => {
	const habit = await getHabitById(habitId, userId);

	const completionsCollection = await completions();

	const lastCompletion = await completionsCollection.findOne(
		{
			habitId: habit._id,
			userId: ObjectId.createFromHexString(userId),
		},
		{ sort: { date: -1 }, projection: { date: 1 } }
	);

	const nextAvailable = lastCompletion
		? calculateNextAvailable(lastCompletion.date, habit.frequency)
		: null;

	return {
		...habit,
		canComplete: await canMarkComplete(habit, userId),
		lastCompleted: lastCompletion ? lastCompletion.date : null,
		nextAvailable: nextAvailable ? nextAvailable.toDate() : null,
		totalCompletions: habit.totalCompletions,
	};
};

export const getHabitExportData = async (habitId, userId) => {
	const completionsCollection = await completions();

	const habit = await getHabitById(habitId, userId);
	const habitCompletions = await completionsCollection
		.find({
			habitId: habit._id,
			userId: ObjectId.createFromHexString(userId),
		})
		.sort({ date: 1 })
		.toArray();

	return {
		name: habit.name,
		description: habit.description,
		frequency: habit.frequency,
		status: habit.status,
		currentStreak: habit.streak,
		totalCompletions: habit.totalCompletions,
		createdAt: habit.createdAt,
		completions: habitCompletions.map((comp) => ({
			date: comp.date,
			time: comp.time,
		})),
	};
};
