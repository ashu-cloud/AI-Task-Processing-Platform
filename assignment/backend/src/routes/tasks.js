const express = require("express");
const { z } = require("zod");
const { Task, SUPPORTED_OPERATIONS } = require("../models/Task");
const { authenticate } = require("../middleware/auth");
const { asyncHandler } = require("../utils/asyncHandler");
const { enqueueTask } = require("../services/taskQueue");

const router = express.Router();

const taskSchema = z.object({
  title: z.string().trim().min(3).max(120),
  inputText: z.string().min(1).max(10000),
  operation: z.enum(SUPPORTED_OPERATIONS),
});

router.use(authenticate);

router.get(
  "/",
  asyncHandler(async (request, response) => {
    const tasks = await Task.find({ userId: request.user.sub })
      .sort({ createdAt: -1 })
      .lean();

    return response.json({ tasks });
  }),
);

router.post(
  "/",
  asyncHandler(async (request, response) => {
    const payload = taskSchema.parse(request.body);

    const task = await Task.create({
      userId: request.user.sub,
      title: payload.title,
      inputText: payload.inputText,
      operation: payload.operation,
      status: "pending",
      logs: [{ message: "Task created and queued." }],
    });

    try {
      await enqueueTask(task);
    } catch (error) {
      task.status = "failed";
      task.errorMessage = "Unable to enqueue task.";
      task.logs.push({ message: `Queue error: ${error.message}` });
      await task.save();
      throw error;
    }

    return response.status(201).json({ task });
  }),
);

router.get(
  "/:taskId",
  asyncHandler(async (request, response) => {
    const task = await Task.findOne({
      _id: request.params.taskId,
      userId: request.user.sub,
    }).lean();

    if (!task) {
      return response.status(404).json({ message: "Task not found." });
    }

    return response.json({ task });
  }),
);

router.get(
  "/:taskId/logs",
  asyncHandler(async (request, response) => {
    const task = await Task.findOne({
      _id: request.params.taskId,
      userId: request.user.sub,
    })
      .select("logs status result errorMessage title operation")
      .lean();

    if (!task) {
      return response.status(404).json({ message: "Task not found." });
    }

    return response.json(task);
  }),
);

module.exports = { tasksRouter: router };
