document.addEventListener("DOMContentLoaded", () => {
	const form = document.querySelector('[data-form="settings"]');
	if (!form) return;

	const validators = {
		firstName: (value) => {
			value = value.trim();
			if (!value) return "First name is required";
			if (value.length < 2)
				return "First name must be at least 2 characters long";
			return null;
		},
		lastName: (value) => {
			value = value.trim();
			if (!value) return "Last name is required";
			if (value.length < 2)
				return "Last name must be at least 2 characters long";
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

	function clearGeneralError() {
		const generalError = form.querySelector('[data-error="general"]');
		if (generalError) {
			generalError.parentElement?.remove();
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

		input.addEventListener("input", (e) => {
			validateField(fieldName, e.target.value);
			clearGeneralError();
		});

		input.addEventListener("blur", (e) => {
			validateField(fieldName, e.target.value);
		});
	});

	form.addEventListener("submit", (e) => {
		let isValid = true;

		// Validate all required fields
		Object.keys(validators).forEach((fieldName) => {
			const input = form.querySelector(`[data-input="${fieldName}"]`);
			if (!input) return;

			if (!validateField(fieldName, input.value)) {
				isValid = false;
			}
		});

		if (!isValid) {
			e.preventDefault();
			clearGeneralError();
		}
	});

	// Clear general error when any checkbox is changed
	const checkboxes = form.querySelectorAll('input[type="checkbox"]');
	checkboxes.forEach((checkbox) => {
		checkbox.addEventListener("change", clearGeneralError);
	});
});
