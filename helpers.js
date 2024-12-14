import { ObjectId } from "mongodb";
import dayjs from "dayjs";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";

import { completions } from "./config/collections.js";

// use plugins
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export const canMarkComplete = async (habit, userId) => {
	// only allow active habits to be completed
	if (habit.status === "inactive") return false;

	const completionsCollection = await completions();
	const lastCompletion = await completionsCollection.findOne(
		{ habitId: habit._id, userId: ObjectId.createFromHexString(userId) },
		{ sort: { date: -1 } }
	);

	if (!lastCompletion) return true;

	const lastCompletionDate = dayjs(lastCompletion.date);
	const currentDate = dayjs();

	switch (habit.frequency) {
		case "daily":
			// Can complete if the last completion was yesterday or earlier
			return !lastCompletionDate.isSame(currentDate, "day");
		case "weekly":
			// Can complete if the last completion was in a previous week
			return !lastCompletionDate.isSame(currentDate, "week");
		case "monthly":
			// Can complete if the last completion was in a previous month
			return !lastCompletionDate.isSame(currentDate, "month");
		default:
			return false;
	}
};

export const calculateNextAvailable = (lastCompletionDate, frequency) => {
	if (!lastCompletionDate) return null;

	const date = dayjs(lastCompletionDate);
	switch (frequency) {
		case "daily":
			return date.add(1, "day").startOf("day");
		case "weekly":
			return date.add(1, "week").startOf("week");
		case "monthly":
			return date.add(1, "month").startOf("month");
		default:
			return null;
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
	const currentDate = dayjs();
	let lastDate = dayjs(allCompletions[0].date);

	// Check if the streak is still active
	switch (habit.frequency) {
		case "daily":
			// If last completion was more than a day ago, streak is broken
			if (currentDate.diff(lastDate, "day") > 1) return 0;
			break;
		case "weekly":
			// If last completion was more than a week ago, streak is broken
			if (currentDate.diff(lastDate, "week") > 1) return 0;
			break;
		case "monthly":
			// If last completion was more than a month ago, streak is broken
			if (currentDate.diff(lastDate, "month") > 1) return 0;
			break;
	}

	// Calculate streak based on consecutive completions
	for (let i = 1; i < allCompletions.length; i++) {
		const currentCompletionDate = dayjs(allCompletions[i].date);

		switch (habit.frequency) {
			case "daily":
				// For daily habits, check if the dates are consecutive
				// We use startOf('day') to ignore time and just compare dates
				const dayDiff = lastDate
					.startOf("day")
					.diff(currentCompletionDate.startOf("day"), "day");

				if (dayDiff === 1) {
					streak++;
					lastDate = currentCompletionDate;
				} else {
					return streak;
				}
				break;

			case "weekly":
				// For weekly habits, check if completions are in consecutive weeks
				const weekDiff = lastDate
					.startOf("week")
					.diff(currentCompletionDate.startOf("week"), "week");

				if (weekDiff === 1) {
					streak++;
					lastDate = currentCompletionDate;
				} else {
					return streak;
				}
				break;

			case "monthly":
				// For monthly habits, check if completions are in consecutive months
				const monthDiff = lastDate
					.startOf("month")
					.diff(currentCompletionDate.startOf("month"), "month");

				if (monthDiff === 1) {
					streak++;
					lastDate = currentCompletionDate;
				} else {
					return streak;
				}
				break;
		}
	}

	return streak;
};

export const getWeeklyRates = (completions, startDate, endDate) => {
	const weeks = [];
	let currentStart = startDate;

	while (currentStart.isBefore(endDate)) {
		const weekEnd = currentStart.add(6, "days");
		const weeklyCompletions = completions.filter((comp) => {
			const compDate = dayjs(comp.date);

			return (
				compDate.isAfter(currentStart, "day") ||
				(compDate.isSame(currentStart, "day") &&
					compDate.isBefore(weekEnd, "day")) ||
				compDate.isSame(weekEnd, "day")
			);
		});

		weeks.push({
			startDate: currentStart.format("YYYY-MM-DD"),
			endDate: weekEnd.format("YYYY-MM-DD"),
			label: `Week ${currentStart.format("MMM D")}`,
			completions: weeklyCompletions.length,
		});

		currentStart = weekEnd.add(1, "day");
	}

	return weeks;
};

export const getMonthlyRates = (completions, startDate, endDate) => {
	const months = [];
	let currentStart = startDate.startOf("month");

	while (currentStart.isBefore(endDate)) {
		const monthEnd = currentStart.endOf("month");
		const monthlyCompletions = completions.filter((comp) => {
			const compDate = dayjs(comp.date);

			return (
				compDate.isAfter(currentStart, "day") ||
				(compDate.isSame(currentStart, "day") &&
					compDate.isBefore(monthEnd, "day")) ||
				compDate.isSame(monthEnd, "day")
			);
		});

		months.push({
			startDate: currentStart.format("YYYY-MM-DD"),
			endDate: monthEnd.format("YYYY-MM-DD"),
			label: currentStart.format("MMMM"),
			completions: monthlyCompletions.length,
		});

		currentStart = currentStart.add(1, "month");
	}

	return months;
};
