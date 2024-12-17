import { dbConnection } from "./connection.js";

const getCollectionFn = (collection) => {
	let _col = undefined;

	return async () => {
		if (!_col) {
			const db = await dbConnection();
			_col = await db.collection(collection);
		}

		return _col;
	};
};

export const users = getCollectionFn("users");
export const habits = getCollectionFn("habits");
export const completions = getCollectionFn("completions");
export const achievements = getCollectionFn("achievements");
