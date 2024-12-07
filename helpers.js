import { ObjectId } from "mongodb";

import { completions } from "./config/collections.js";

export const canMarkComplete = async (habit, userId) => {
	const completionsCollection = await completions();
	const lastCompletion = await completionsCollection.findOne(
		{ habitId: habit._id, userId: ObjectId.createFromHexString(userId) },
		{ sort: { date: -1 } }
	);

	if (!lastCompletion) return true;

	const lastCompletionDate = new Date(lastCompletion.date);
	const currentDate = new Date();

	switch (habit.frequency) {
		case "daily":
			return (
				lastCompletionDate.getDate() !== currentDate.getDate() ||
				lastCompletionDate.getMonth() !== currentDate.getMonth() ||
				lastCompletionDate.getFullYear() !== currentDate.getFullYear()
			);
		case "weekly":
			const weekDiff = Math.floor(
				(currentDate - lastCompletionDate) / (7 * 24 * 60 * 60 * 1000)
			);
			return weekDiff >= 1;
		case "monthly":
			return (
				lastCompletionDate.getMonth() !== currentDate.getMonth() ||
				lastCompletionDate.getFullYear() !== currentDate.getFullYear()
			);
		default:
			return false;
	}
};

export const calculateStreak = async (habit, userId) => {
	const completionsCollection = await completions();
	const allCompletions = await completionsCollection
		.find({
			habitId: habit._id,
			userId: ObjectId.createFromHexString(userId),
		})
		.sort({ date: -1 })
		.toArray();

	if (allCompletions.length === 0) return 0;

	let streak = 1;
	const currentDate = new Date();
	let lastDate = new Date(allCompletions[0].date);

	// Check if the most recent completion is within the frequency window
	switch (habit.frequency) {
		case "daily":
			// If last completion is not from today or yesterday, the streak is broken
			const daysDiff = Math.floor(
				(currentDate - lastDate) / (24 * 60 * 60 * 1000)
			);
			if (daysDiff > 1) return 0;
			break;
		case "weekly":
			const weekDiff = Math.floor(
				(currentDate - lastDate) / (7 * 24 * 60 * 60 * 1000)
			);
			if (weekDiff > 1) return 0;
			break;
		case "monthly":
			const monthDiff =
				currentDate.getMonth() -
				lastDate.getMonth() +
				12 * (currentDate.getFullYear() - lastDate.getFullYear());
			if (monthDiff > 1) return 0;
			break;
	}

	// Calculate streak based on consecutive completions
	const { streak: finalStreak } = allCompletions.slice(1).reduce(
		({ streak, lastDate }, completion) => {
			const currentCompletionDate = new Date(completion.date);
			const timeDiff = lastDate - currentCompletionDate;

			switch (habit.frequency) {
				case "daily":
					if (Math.floor(timeDiff / (24 * 60 * 60 * 1000)) === 1) {
						return { streak: streak + 1, lastDate: currentCompletionDate };
					}
					return { streak, lastDate }; // Break streak
				case "weekly":
					if (Math.floor(timeDiff / (7 * 24 * 60 * 60 * 1000)) === 1) {
						return { streak: streak + 1, lastDate: currentCompletionDate };
					}
					return { streak, lastDate }; // Break streak
				case "monthly":
					const monthDiff =
						lastDate.getMonth() -
						currentCompletionDate.getMonth() +
						12 * (lastDate.getFullYear() - currentCompletionDate.getFullYear());
					if (monthDiff === 1) {
						return { streak: streak + 1, lastDate: currentCompletionDate };
					}
					return { streak, lastDate }; // Break streak
				default:
					return { streak, lastDate };
			}
		},
		{ streak: 1, lastDate: new Date(allCompletions[0].date) }
	);

	return finalStreak;
};
