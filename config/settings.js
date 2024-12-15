const SERVER_URL = process.env.MONGODB_SERVER_URL;
const DATABASE = process.env.MONGODB_DATABASE;

export const mongoConfig = {
	serverUrl: SERVER_URL,
	database: DATABASE,
};
