import dayjs from "dayjs";

export const handlebarsHelpers = {
	eq: (a, b) => a === b,
	formatDate: (date) => {
		return dayjs(date).format("MMM D, YYYY");
	},
	fromNow: (date) => {
		return dayjs(date).fromNow();
	},
};
