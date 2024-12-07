export async function markHabitComplete(habitId) {
	try {
		const response = await fetch(`/api/habits/${habitId}/complete`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		});
		const data = await response.json();

		if (!data.success) {
			throw new Error(data.message || "Failed to complete habit!");
		}

		// update the card UI
		const habitCard = document.getElementById(habitId);
		const button = habitCard.querySelector("[data-complete-button]");
		const streakElement = habitCard.querySelector("[data-streak]");
		const completionsElement = habitCard.querySelector("[data-completions]");

		// update the stats
		if (streakElement) streakElement.textContent = `${data.habit.streak}`;
		if (completionsElement)
			completionsElement.textContent = `${data.habit.totalCompletions}`;

		// disable the button
		button.disabled = true;
		button.textContent = `Complete again ${data.habit.frequency}`;
	} catch (err) {
		console.error("Error:", err);
		alert(err.message || "Failed to complete habit!");
	}
}
