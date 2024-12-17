import dayjs from "dayjs";
import { habits, users } from "../config/collections.js";
import transporter from "../config/nodemailer.js";

// to be completely honest, I don't know how this works, but it works
// took some suggestions from ChatGPT to see what the best way of implementing the whole reminders thing was
// and it suggested using a schedule with a timeout that runs when the server is up
// NOTE: THE CODE IS NOT BY CHATGPT, ONLY THE IDEA IS
// cron jobs were not the best solution unfortunately
// I have tried to implement this with multiple test cases of my own,
// but given the shorter time period to implement the project,
// I'm not sure if it works perfectly for larger frequencies like monthly reminders

class ReminderService {
	constructor() {
		this.scheduledReminders = new Map();
	}

	calculateNextReminderTime(habit) {
		const [hours, minutes, period] = habit.reminder.time
			.match(/(\d+):(\d+) (AM|PM)/)
			.slice(1);
		let targetTime = dayjs()
			.hour(
				period === "PM" && hours !== "12"
					? parseInt(hours) + 12
					: parseInt(hours)
			)
			.minute(parseInt(minutes))
			.second(0);

		// If time has passed for today, send the reminder tomorrow
		if (targetTime.isBefore(dayjs())) {
			targetTime = targetTime.add(1, "day");
		}

		switch (habit.frequency) {
			case "daily":
				// Already handled above
				break;

			case "weekly":
				// next weekday of when the habit was created
				const habitCreatedDay = dayjs(habit.createdAt).day();
				while (targetTime.day() !== habitCreatedDay) {
					targetTime = targetTime.add(1, "day");
				}
				break;

			case "monthly":
				// next date of the month when the habit was created
				const habitCreatedDate = dayjs(habit.createdAt).date();
				while (targetTime.date() !== habitCreatedDate) {
					targetTime = targetTime.add(1, "day");
				}
				break;
		}

		return targetTime;
	}

	async scheduleReminder(habit, user) {
		// Cancel existing reminder if any for the habit
		if (this.scheduledReminders.has(habit._id.toString())) {
			this.cancelReminder(habit._id.toString());
		}

		// dont schedule for inactive habits
		if (
			habit.status === "inactive" ||
			!habit.reminder ||
			habit.reminder.status === "inactive"
		) {
			this.cancelReminder(habit._id.toString());
			return;
		}

		const nextReminderTime = this.calculateNextReminderTime(habit);
		const delay = nextReminderTime.diff(dayjs());

		const timeoutId = setTimeout(async () => {
			await this.sendReminderEmail(habit, user);

			const nextInterval = {
				daily: 1,
				weekly: 7,
				monthly: nextReminderTime.add(1, "month").diff(nextReminderTime, "day"),
			}[habit.frequency];

			const updatedHabit = {
				...habit,
				nextReminderTime: nextReminderTime
					.add(nextInterval, "day")
					.toISOString(),
			};

			// Reschedule next reminder
			this.scheduleReminder(updatedHabit, user);
		}, delay);

		this.scheduledReminders.set(habit._id.toString(), {
			timeoutId,
			nextRun: nextReminderTime.toISOString(),
			frequency: habit.frequency,
		});
	}

	cancelReminder(habitId) {
		const reminder = this.scheduledReminders.get(habitId);
		if (reminder) {
			clearTimeout(reminder.timeoutId);
			this.scheduledReminders.delete(habitId);
		}
	}

	async sendReminderEmail(habit, user) {
		try {
			const frequencyText = {
				daily: "today",
				weekly: "this week",
				monthly: "this month",
			}[habit.frequency];

			const frequencyStreak = {
				daily: "days",
				weekly: "weeks",
				monthly: "months",
			}[habit.frequency];

			await transporter.sendMail({
				from: process.env.EMAIL_USER,
				to: user.email,
				subject: `Reminder: Time to ${habit.name}!`,
				html: `
          <h2>Habit Reminder</h2>
          <p>Don't forget to ${habit.name.toLowerCase()} ${frequencyText}!</p>
          <p>Current streak: ${habit.streak} ${frequencyStreak} 🔥</p>
          <a href="${process.env.APP_URL}/habits/${habit._id}">
            Mark as complete
          </a>
        `,
			});
		} catch (error) {
			console.error(`Failed to send reminder for habit ${habit._id}:`, error);
		}
	}

	async initializeReminders() {
		const habitsCollection = await habits();
		const usersCollection = await users();

		// Get all active habits with active reminders
		const habitsWithReminders = await habitsCollection
			.find({
				"reminder.status": "active",
				status: "active",
			})
			.toArray();

		// Schedule each reminder
		for (const habit of habitsWithReminders) {
			const user = await usersCollection.findOne({ _id: habit.userId });
			if (user && user.emailPreferences.habitReminders) {
				await this.scheduleReminder(habit, user);
			}
		}
	}

	// Debugging only
	getScheduledReminders() {
		return Array.from(this.scheduledReminders.entries()).map(
			([habitId, reminder]) => ({
				habitId,
				nextRun: reminder.nextRun,
				frequency: reminder.frequency,
			})
		);
	}

	async start() {
		await this.initializeReminders();
	}

	stop() {
		for (const habitId of this.scheduledReminders.keys()) {
			this.cancelReminder(habitId);
		}
	}
}

const reminderService = new ReminderService();
export default reminderService;
