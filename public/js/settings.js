export async function resendVerification() {
	const button = document.getElementById("resend-button");
	const successDiv = document.getElementById("resend-success");
	const errorDiv = document.getElementById("resend-error");
	const errorText = errorDiv.querySelector("p");

	successDiv.classList.add("hidden");
	errorDiv.classList.add("hidden");
	button.disabled = true;
	button.innerHTML =
		'<i data-lucide="loader-circle" class="size-4 animate-spin"></i> Sending';

	try {
		const response = await fetch("/api/auth/resend-verification", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
		});

		const data = await response.json();

		if (data.success) {
			successDiv.classList.remove("hidden");

			button.innerHTML = `<i data-lucide="mail-check" class="size-4"></i> ${data.message}`;

			if (window.lucide) {
				window.lucide.createIcons();
			}
		} else {
			throw new Error(data.message);
		}
	} catch (error) {
		errorText.textContent =
			error.message || "Failed to send verification email";
		errorDiv.classList.remove("hidden");
		button.disabled = false;
		button.innerHTML =
			'<i data-lucide="send" class="size-4"></i> Resend Verification Email';
	}
}
