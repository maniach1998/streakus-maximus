// Schema validation helper for using Zod schemas
// checks if the request data is of the proper type

const validate = (schema) => {
	return (req, res, next) => {
		try {
			schema.parse(req.body);
			next();
		} catch (err) {
			res.status(400).json({
				success: false,
				errors: err.errors.map((e) => e.message),
			});
		}
	};
};

export default validate;
