import { ObjectId } from "mongodb";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime.js";
import isBetween from "dayjs/plugin/isBetween.js";

import { completions, habits } from "../config/collections.js";
import { getHabitById } from "./habits.js";
import {
	calculateAllStreaks,
	getMonthlyRates,
	getWeeklyRates,
} from "../helpers.js";

dayjs.extend(relativeTime);
dayjs.extend(isBetween);

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

	const { longestStreak } = calculateAllStreaks(
		habitCompletions,
		habit.frequency
	);

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
	const recentCompletions = habitCompletions
		.filter((completion) => dayjs(completion.date).isAfter(thirtyDaysAgo))
		.sort((a, b) => new Date(b.date) - new Date(a.date));

	return {
		totalCompletions: habitCompletions.length,
		completionRate,
		currentStreak: habit.streak,
		longestStreak: longestStreak.duration || habit.streak,
		recentCompletions: recentCompletions.map((completion) => ({
			...completion,
			fromNow: dayjs(completion.date).fromNow(),
		})),
		daysSinceCreation,
		expectedCompletions,
	};
};

export const getWeeklyOverview = async (userId) => {
	try {
		const habitsCollection = await habits();
		const completionsCollection = await completions();

		// Get all active habits
		const activeHabits = await habitsCollection
			.find({
				userId: ObjectId.createFromHexString(userId),
				status: "active",
			})
			.toArray();

		// Calculate week range
		const now = dayjs();
		const startOfWeek = now.startOf("week");
		const endOfWeek = now.endOf("week");

		// Get all completions for the week
		const weeklyCompletions = await completionsCollection
			.find({
				userId: ObjectId.createFromHexString(userId),
				date: {
					$gte: startOfWeek.toISOString(),
					$lte: endOfWeek.toISOString(),
				},
			})
			.toArray();

		// Generate daily summary
		const days = [];
		let currentDate = startOfWeek;

		while (
			currentDate.isBefore(endOfWeek) ||
			currentDate.isSame(endOfWeek, "day")
		) {
			// Get completions for current day
			const dayCompletions = weeklyCompletions.filter(
				(completion) =>
					dayjs(completion.date).format("YYYY-MM-DD") ===
					currentDate.format("YYYY-MM-DD")
			);

			// Get completed habits details for the day
			const completedHabits = dayCompletions
				.map((completion) => {
					const habit = activeHabits.find(
						(h) => h._id.toString() === completion.habitId.toString()
					);
					return habit
						? {
								name: habit.name,
								time: completion.time,
						  }
						: null;
				})
				.filter(Boolean);

			days.push({
				date: currentDate.format("MMM D"),
				dayName: currentDate.format("ddd"),
				isToday: currentDate.isSame(now, "day"),
				completedCount: completedHabits.length,
				totalHabits: activeHabits.length,
				completedHabits,
			});

			currentDate = currentDate.add(1, "day");
		}

		return {
			totalHabits: activeHabits.length,
			days,
		};
	} catch (error) {
		console.error("Error in getWeeklyOverview:", error);
		throw error;
	}
};

export const getHabitProgress = async (
	habitId,
	userId,
	timeframe = "month"
) => {
	const habit = await getHabitById(habitId, userId);
	const completionsCollection = await completions();

	const today = dayjs();
	const startDate =
		timeframe === "year"
			? today.subtract(1, "year").startOf("day")
			: today.subtract(30, "days").startOf("day");
	const endDate = today.endOf("day");

	console.log("date range: ", {
		startDate: startDate.format("YYYY-MM-DD"),
		endDate: endDate.format("YYYY-MM-DD"),
	});

	// get completions within date range
	const habitCompletions = await completionsCollection
		.find({
			habitId: ObjectId.createFromHexString(habitId),
			userId: ObjectId.createFromHexString(userId),
			date: {
				$gte: startDate.toISOString(),
				$lte: endDate.toISOString(),
			},
		})
		.sort({ date: -1 })
		.toArray();

	console.log("habit completions: ", {
		habitId,
		count: habitCompletions.length,
		completions: habitCompletions.map((c) => ({
			date: c.date,
			isoDate: new Date(c.date).toISOString(),
		})),
	});

	const calendarData = [];
	let currentDate = startDate;

	while (currentDate.isBefore(endDate) || currentDate.isSame(endDate, "day")) {
		const formattedDate = currentDate.format("YYYY-MM-DD");
		const completed = habitCompletions.some(
			(comp) => dayjs(comp.date).format("YYYY-MM-DD") === formattedDate
		);

		calendarData.push({
			date: formattedDate,
			completed,
		});

		currentDate = currentDate.add(1, "day");
	}

	const completionRates =
		timeframe === "year"
			? getMonthlyRates(habitCompletions, startDate, endDate)
			: getWeeklyRates(habitCompletions, startDate, endDate);

	return { habit, calendarData, completionRates, timeframe };
};
