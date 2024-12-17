async function toggleHabitStatus(habitId, currentStatus) {
	try {
		const statusButton = document.querySelector("[data-status-toggle]");
		const statusIndicator = document.querySelector("[data-status-indicator]");
		if (!statusButton || !statusIndicator) return;

		statusButton.disabled = true;

		const endpoint = currentStatus === "active" ? "deactivate" : "reactivate";

		const response = await fetch(`/api/habits/${habitId}/${endpoint}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || `Failed to ${endpoint} habit`);
		}

		const data = await response.json();
		const newStatus = data.habit.status;

		statusIndicator.innerHTML = `
      <span class="inline-flex items-center gap-1.5">
        ${newStatus === "active" ? "Active" : "Inactive"}
        <span class="relative flex h-2 w-2">
          <span class="absolute inline-flex h-full w-full rounded-full ${
						newStatus === "active" ? "bg-green-500" : "bg-gray-500"
					}"></span>
        </span>
      </span>
    `;

		statusButton.innerHTML =
			newStatus === "active"
				? '<i data-lucide="power" class="size-4"></i>Deactivate'
				: '<i data-lucide="power" class="size-4"></i>Reactivate';

		statusButton.classList.toggle("text-destructive", newStatus === "active");
		statusButton.classList.toggle("text-primary", newStatus === "inactive");

		statusButton.setAttribute(
			"onclick",
			`toggleHabitStatus('${habitId}', '${newStatus}')`
		);

		// If habit has a reminder section, update it
		const reminderSection = document.querySelector("[data-reminder-section]");
		if (reminderSection) {
			const reminderStatus = document.querySelector("[data-reminder-status]");
			const reminderToggle = document.querySelector("[data-reminder-toggle]");

			if (reminderStatus && data.habit.reminder) {
				reminderStatus.innerHTML = `
          ${data.habit.reminder.time}
          <span class="inline-block w-2 h-2 rounded-full ${
						data.habit.reminder.status === "active"
							? "bg-green-500"
							: "bg-gray-500"
					} mr-2"></span>
        `;
			}

			if (reminderToggle) {
				reminderToggle.disabled = newStatus === "inactive";
			}
		}

		if (window.lucide) {
			window.lucide.createIcons();
		}
	} catch (error) {
		alert(error.message);
		if (statusButton) statusButton.disabled = false;
	}
}
