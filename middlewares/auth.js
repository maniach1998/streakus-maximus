export function requireAuth(req, res, next) {
	if (!req.session.isAuthenticated) {
		return res.redirect("/auth/login");
	}
	next();
}

export function setUserDefaults(req, res, next) {
	res.locals.isAuthenticated = req.session.isAuthenticated || false;
	next();
}
