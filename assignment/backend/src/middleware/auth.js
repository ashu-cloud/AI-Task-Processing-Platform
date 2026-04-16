const jwt = require("jsonwebtoken");
const { env } = require("../config/env");

function authenticate(request, response, next) {
  const header = request.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return response.status(401).json({ message: "Authentication required." });
  }

  try {
    const payload = jwt.verify(token, env.jwtSecret);
    request.user = payload;
    return next();
  } catch {
    return response.status(401).json({ message: "Invalid or expired token." });
  }
}

module.exports = { authenticate };
