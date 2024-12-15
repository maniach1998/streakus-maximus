function initializeCompletionPieChart(completions, expected) {
	const ctx = document.getElementById("completionPieChart").getContext("2d");
	if (!ctx) return;

	const missed = Math.max(0, expected - completions);

	new Chart(ctx, {
		type: "pie",
		data: {
			labels: ["Completed", "Missed"],
			datasets: [
				{
					data: [completions, missed],
					backgroundColor: [
						`hsl(${getComputedStyle(document.documentElement)
							.getPropertyValue("--primary")
							.trim()})`,
						`hsl(${getComputedStyle(document.documentElement)
							.getPropertyValue("--muted")
							.trim()})`,
					],
					borderWidth: 0,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: true,
			plugins: {
				legend: {
					position: "bottom",
					labels: {
						usePointStyle: true,
						padding: 20,
						font: {
							size: 12,
						},
					},
				},
				tooltip: {
					callbacks: {
						label: function (context) {
							const label = context.label || "";
							const value = context.raw || 0;
							const total = context.dataset.data.reduce((a, b) => a + b, 0);
							const percentage = Math.round((value / total) * 100);
							return `${label}: ${value} (${percentage}%)`;
						},
					},
				},
			},
		},
	});
}

document.addEventListener("DOMContentLoaded", function () {
	const chartElement = document.getElementById("completionPieChart");
	if (chartElement) {
		const completions = parseInt(chartElement.dataset.completions);
		const expected = parseInt(chartElement.dataset.expected);
		initializeCompletionPieChart(completions, expected);
	}
});
