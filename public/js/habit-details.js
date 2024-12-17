async function completeHabit(habitId) {
	try {
		const button = document.querySelector("[data-complete-button]");
		if (!button) return;

		button.disabled = true;

		const response = await fetch(`/api/habits/${habitId}/complete`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || "Failed to complete habit");
		}

		const data = await response.json();

		const streakElement = document.querySelector("[data-streak]");
		if (streakElement) {
			streakElement.textContent = data.habit.streak;
		}

		const completionsElement = document.querySelector("[data-completions]");
		if (completionsElement) {
			completionsElement.textContent = data.habit.totalCompletions;
		}

		const lastCompletedSection = document.querySelector(
			"[data-last-completed]"
		);
		if (lastCompletedSection) {
			const dateText = formatDate(data.habit.lastCompleted);
			const timeAgo = formatTimeAgo(data.habit.lastCompleted);
			lastCompletedSection.innerHTML = `
        <h3 class="text-sm font-medium text-muted-foreground">Last Completed</h3>
        <p class="mt-1 font-medium">${dateText} (${timeAgo})</p>
      `;
		}

		const nextAvailableSection = document.querySelector(
			"[data-next-available]"
		);
		if (nextAvailableSection) {
			const dateText = formatDate(data.habit.nextAvailable);
			const timeAgo = formatTimeAgo(data.habit.nextAvailable);
			nextAvailableSection.innerHTML = `
        <h3 class="text-sm font-medium text-muted-foreground">Next Available</h3>
        <p class="mt-1 font-medium">${dateText} (${timeAgo})</p>
      `;
		}

		button.innerHTML = `
      <i data-lucide="check-check" class="size-4"></i>
      Complete again ${data.habit.frequency}
    `;
		button.disabled = true;

		const notification = document.querySelector("[data-complete-notification]");
		if (notification) {
			notification.remove();
		}

		// Reinitialize Lucide icons for the new button content
		if (window.lucide) {
			window.lucide.createIcons();
		}
	} catch (error) {
		alert(error.message);
		if (button) button.disabled = false;
	}
}

function formatDate(dateString) {
	return new Date(dateString).toLocaleDateString("en-US", {
		year: "numeric",
		month: "long",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function formatTimeAgo(dateString) {
	const date = new Date(dateString);
	const now = new Date();
	const diffTime = Math.abs(date - now);
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	if (date > now) {
		if (diffDays === 1) return "tomorrow";
		if (diffDays < 7) return `in ${diffDays} days`;
		if (diffDays < 30) return `in ${Math.ceil(diffDays / 7)} weeks`;
		return `in ${Math.ceil(diffDays / 30)} months`;
	} else {
		if (diffDays === 1) return "yesterday";
		if (diffDays < 7) return `${diffDays} days ago`;
		if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
		return `${Math.ceil(diffDays / 30)} months ago`;
	}
}
