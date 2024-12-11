import bcrypt from "bcrypt";

import {
	userIdSchema,
	userEmailSchema,
	userSchema,
	loginSchema,
} from "../schemas/users.js";
import { users } from "../config/collections.js";

export const createUser = async (data) => {
	const validatedData = userSchema.parse(data);
	const usersCollection = await users();

	// check if user already exists
	const userExists = await usersCollection.findOne({
		email: validatedData.email,
	});
	if (userExists)
		throw new Error("An account with this email already exists!", {
			cause: 409,
		});

	// hash the password
	const salt = await bcrypt.genSalt(12);
	const hashedPassword = await bcrypt.hash(validatedData.password, salt);

	const newUser = {
		...validatedData,
		password: hashedPassword,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
	};

	// add user to database
	const response = await usersCollection.insertOne(newUser);
	if (response.acknowledged !== true)
		throw new Error("Something went wrong!", { cause: 500 });

	const cleanedUser = {
		email: newUser.email,
		firstName: newUser.firstName,
		lastName: newUser.lastName,
	};

	return { registered: true, user: cleanedUser };
};

export const findUserByEmail = async (email) => {
	const validatedData = userEmailSchema.parse({ email });
	const usersCollection = await users();

	// find the user
	const userExists = await usersCollection.findOne({
		email: validatedData.email,
	});
	if (!userExists) throw new Error("User not found!", { cause: 404 });

	return userExists;
};

export const loginUser = async (data) => {
	const validatedData = loginSchema.parse(data);
	const usersCollection = await users();

	// find if the user exists
	const user = await usersCollection.findOne({ email: validatedData.email });
	if (!user) throw new Error("Incorrect email or password!", { cause: 404 });

	const confirmPassword = await bcrypt.compare(
		validatedData.password,
		user.password
	);
	if (!confirmPassword)
		throw new Error("Incorrect email or password!", { cause: 404 });

	delete user.password;

	return user;
};
