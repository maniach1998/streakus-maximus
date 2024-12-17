document.addEventListener("DOMContentLoaded", () => {
	const form = document.querySelector('[data-form="new-habit"]');
	if (!form) return;

	const validators = {
		name: (value) => {
			value = value.trim();
			if (!value) return "Habit name is required";
			if (value.length < 3)
				return "Habit name must be at least 3 characters long!";
			return null;
		},
		description: (value) => {
			value = value.trim();
			if (!value) return "Description is required";
			if (value.length < 10)
				return "Description must be at least 10 characters long";
			return null;
		},
		frequency: (value) => {
			if (!value) return "Frequency is required";
			const validFrequencies = ["daily", "weekly", "monthly"];
			if (!validFrequencies.includes(value)) {
				return "Frequency must be either 'daily', 'weekly', or 'monthly'";
			}
			return null;
		},
		reminderTime: (value) => {
			if (!value) return null; // Optional field

			// Check if time is in valid format (HH:mm)
			const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
			if (!timeRegex.test(value)) {
				return "Time must be in HH:mm format";
			}
			return null;
		},
	};

	function showError(fieldName, message) {
		const input = form.querySelector(`[data-input="${fieldName}"]`);
		const error = form.querySelector(`[data-error="${fieldName}"]`);

		if (input && error) {
			input.classList.add("border-destructive");
			error.textContent = message;
		}
	}

	function clearError(fieldName) {
		const input = form.querySelector(`[data-input="${fieldName}"]`);
		const error = form.querySelector(`[data-error="${fieldName}"]`);

		if (input && error) {
			input.classList.remove("border-destructive");
			error.textContent = "";
		}
	}

	function validateField(fieldName, value) {
		const validator = validators[fieldName];
		if (!validator) return true;

		const error = validator(value);
		if (error) {
			showError(fieldName, error);
			return false;
		}

		clearError(fieldName);
		return true;
	}

	Object.keys(validators).forEach((fieldName) => {
		const input = form.querySelector(`[data-input="${fieldName}"]`);
		if (!input) return;

		// For select elements, use change event instead of input
		const event = input.tagName.toLowerCase() === "select" ? "change" : "input";

		input.addEventListener(event, (e) => {
			validateField(fieldName, e.target.value);
		});

		input.addEventListener("blur", (e) => {
			validateField(fieldName, e.target.value);
		});
	});

	form.addEventListener("submit", (e) => {
		let isValid = true;

		Object.keys(validators).forEach((fieldName) => {
			const input = form.querySelector(`[data-input="${fieldName}"]`);
			if (!input) return;

			// Skip validation for optional reminder field
			if (fieldName === "reminderTime" && !input.value) {
				return;
			}

			if (!validateField(fieldName, input.value)) {
				isValid = false;
			}
		});

		if (!isValid) {
			e.preventDefault();
		}
	});
});
