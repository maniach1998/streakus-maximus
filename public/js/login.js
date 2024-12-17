document.addEventListener("DOMContentLoaded", () => {
	const form = document.querySelector('[data-form="login"]');
	if (!form) return;

	const validators = {
		email: (value) => {
			value = value.trim();
			if (!value) return "Email is required";
			const emailRegex =
				/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			if (!emailRegex.test(value)) return "Invalid email format";
			return null;
		},
		password: (value) => {
			if (!value) return "Password is required";
			if (value.length <= 8)
				return "Password must be more than 8 characters long";
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

		// Validate all fields
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
});
