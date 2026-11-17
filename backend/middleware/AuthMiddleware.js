const ApiError = require("../utils/ApiError");
const { verifyLoginToken } = require("../utils/token");
const User = require("../models/userModel");
const TokenBlacklist = require("../models/tokenBlacklistModel");
const { authorize } = require("./RoleMiddleware");

// Checks the "Authorization: Bearer <token>" header and sets req.user.
async function protect(req, res, next) {
	try {
		const [type, token] = (req.headers.authorization || "").split(" ");
		if (type !== "Bearer" || !token) throw new ApiError(401, "Please log in first");

		const decoded = verifyLoginToken(token); // throws if invalid or expired

		const loggedOut = await TokenBlacklist.exists({ jti: decoded.jti });
		if (loggedOut) throw new ApiError(401, "You are logged out, please log in again");

		const user = await User.findById(decoded.id);
		if (!user) throw new ApiError(401, "This user no longer exists");

		req.user = { id: user._id.toString(), role: user.role };
		req.token = decoded; // needed by logout
		next();
	} catch (error) {
		next(error); // sends the error to the error handler (this is what asyncHandler did for us)
	}
}

// Like protect, but guests without a token are allowed through.
// A token that is sent but invalid is still rejected.
async function optionalProtect(req, res, next) {
	if (!req.headers.authorization) return next();
	return protect(req, res, next);
}

// Same check as authorize in RoleMiddleware, under the name the routes use.
const restrictTo = authorize;

module.exports = { protect, optionalProtect, restrictTo };