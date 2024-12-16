async function toggleReminder(habitId) {
	try {
		const button = document.querySelector("[data-reminder-toggle]");
		const currentStatus =
			button.textContent.trim() === "Remove Reminder" ? "inactive" : "active";

		button.disabled = true;

		const response = await fetch(`/api/habits/${habitId}/reminder`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ status: currentStatus }),
		});

		if (!response.ok) {
			const error = await response.json();
			throw new Error(error.message || "Failed to update reminder");
		}

		window.location.reload();
	} catch (error) {
		alert(error.message);
		button.disabled = false;
	}
}
