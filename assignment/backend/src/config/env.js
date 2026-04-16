const dotenv = require("dotenv");

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  mongoUri:
    process.env.MONGO_URI || "mongodb://localhost:27017/ai-task-platform",
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379/0",
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  saltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 10),
};

module.exports = { env };
