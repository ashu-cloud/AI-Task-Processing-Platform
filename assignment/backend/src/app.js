const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const { ZodError } = require("zod");
const { authRouter } = require("./routes/auth");
const { tasksRouter } = require("./routes/tasks");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const { env } = require("./config/env");

const app = express();

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: false,
  }),
);
app.use(helmet());
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/tasks", tasksRouter);

app.use((error, _request, _response, next) => {
  if (error instanceof ZodError) {
    error.statusCode = 400;
    error.message = error.issues.map((issue) => issue.message).join(", ");
  }

  next(error);
});

app.use(notFound);
app.use(errorHandler);

module.exports = { app };
