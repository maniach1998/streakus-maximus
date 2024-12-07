import { ObjectId } from "mongodb";

import { completions, habits } from "../config/collections.js";
import { completionSchema } from "../schemas/completions.js";
import { getHabitById } from "./habits.js";
import { canMarkComplete, calculateStreak } from "../helpers.js";

export const markHabitComplete = async (habitId, userId) => {
	const validatedData = completionSchema.parse({
		habitId,
		date: new Date().toISOString(),
		time: new Date().toLocaleTimeString("en-US", {
			hour: "2-digit",
			minute: "2-digit",
			hour12: true,
		}),
	});

	const habit = await getHabitById(habitId, userId);
	const canComplete = await canMarkComplete(habit, userId);

	if (!canComplete)
		throw new Error("Cannot complete habit again until next interval", {
			cause: 400,
		});

	const completionsCollection = await completions();
	const habitsCollection = await habits();

	// Create a new completion
	const newCompletion = {
		...validatedData,
		habitId: ObjectId.createFromHexString(validatedData.habitId),
		userId: ObjectId.createFromHexString(userId),
	};

	const response = await completionsCollection.insertOne(newCompletion);
	if (!response.acknowledged) {
		throw new Error("Failed to mark habit as complete", { cause: 500 });
	}

	// Calculate new streak and update habit stats
	const newStreak = await calculateStreak(habit, userId);
	const streakUpdateResponse = await habitsCollection.findOneAndUpdate(
		{
			_id: ObjectId.createFromHexString(habitId),
			userId: ObjectId.createFromHexString(userId),
		},
		{
			$set: {
				streak: newStreak,
				updatedAt: new Date().toISOString(),
			},
			$inc: {
				totalCompletions: 1,
			},
		},
		{ returnDocument: "after" }
	);

	if (!streakUpdateResponse)
		throw new Error("Failed to update habit stats!", { cause: 500 });

	return {
		completion: {
			_id: response.insertedId,
			...newCompletion,
		},
		habit: streakUpdateResponse,
	};
};

export const getHabitCompletions = async (habitId, userId) => {
	const completionsCollection = await completions();

	const habitCompletions = await completionsCollection
		.find({
			habitId: ObjectId.createFromHexString(habitId),
			userId: ObjectId.createFromHexString(userId),
		})
		.sort({ date: -1 })
		.toArray();

	return habitCompletions;
};
