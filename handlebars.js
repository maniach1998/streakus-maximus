import { canMarkComplete } from "./helpers.js";

export const handlebarsHelpers = {
	canComplete: async function (habit, userId) {
		return await canMarkComplete(habit, userId);
	},
	formatDate: function (date) {
		return new Date(date).toLocaleDateString();
	},
};
