import dayjs from "dayjs";

export const handlebarsHelpers = {
	eq: (a, b) => a === b,
	json: (content) => JSON.stringify(content),
	formatDate: (date) => {
		return dayjs(date).format("MMM D, YYYY");
	},
	formatShortDate: (date) => {
		return dayjs(date).format("D MMM");
	},
	formatOneDigitDate: (date) => {
		return dayjs(date).format("D");
	},
	formatMonth: (date) => {
		return dayjs(date).format("MMM");
	},
	fromNow: (date) => {
		return dayjs(date).fromNow();
	},
	formatTime: (time) => {
		return dayjs(time, "hh:mm A").format("HH:mm");
	},
};
