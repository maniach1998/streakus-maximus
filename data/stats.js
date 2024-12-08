import { ObjectId } from "mongodb";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";

import { completions } from "../config/collections.js";
import { getHabitById } from "./habits.js";

dayjs.extend(relativeTime);

export const getHabitStats = async (habitId, userId) => {
	// Verify habit exists and belongs to user
	const habit = await getHabitById(habitId, userId);
	const completionsCollection = await completions();

	// Get all completions for this habit
	const habitCompletions = await completionsCollection
		.find({
			habitId: ObjectId.createFromHexString(habitId),
			userId: ObjectId.createFromHexString(userId),
		})
		.sort({ date: -1 })
		.toArray();

	// Calculate days since habit creation
	const createdAt = dayjs(habit.createdAt).startOf("day");
	const today = dayjs().startOf("day");
	const daysSinceCreation = Math.max(1, today.diff(createdAt, "day"));

	// Calculate expected completions based on frequency
	let expectedCompletions = 0;
	switch (habit.frequency) {
		case "daily":
			expectedCompletions = Math.max(1, daysSinceCreation);
			break;
		case "weekly":
			expectedCompletions = Math.max(1, Math.ceil(daysSinceCreation / 7));
			break;
		case "monthly":
			expectedCompletions = Math.max(1, Math.ceil(daysSinceCreation / 30));
			break;
	}

	// Calculate completion rate
	const completionRate = Math.min(
		100,
		Math.round((habitCompletions.length / expectedCompletions) * 100)
	);

	// Get recent completions (last 30 days)
	const thirtyDaysAgo = today.subtract(30, "day");
	const recentCompletions = habitCompletions.filter((completion) =>
		dayjs(completion.date).isAfter(thirtyDaysAgo)
	);

	return {
		totalCompletions: habitCompletions.length,
		completionRate,
		currentStreak: habit.streak,
		longestStreak: habit.longestStreak || habit.streak,
		recentCompletions: recentCompletions.map((completion) => ({
			...completion,
			fromNow: dayjs(completion.date).fromNow(),
		})),
		daysSinceCreation,
		expectedCompletions,
	};
};
