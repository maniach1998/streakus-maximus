import { ObjectId } from "mongodb";

import { habits } from "../config/collections.js";
import {
	habitSchema,
	habitIdSchema,
	updateHabitSchema,
	habitStatusSchema,
} from "../schemas/habits.js";

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
