const mongoose = require("mongoose");

const SUPPORTED_OPERATIONS = [
  "uppercase",
  "lowercase",
  "reverse",
  "word_count",
];

const logSchema = new mongoose.Schema(
  {
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    inputText: {
      type: String,
      required: true,
    },
    operation: {
      type: String,
      enum: SUPPORTED_OPERATIONS,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "running", "success", "failed"],
      default: "pending",
      index: true,
    },
    result: {
      type: String,
      default: "",
    },
    errorMessage: {
      type: String,
      default: "",
    },
    logs: {
      type: [logSchema],
      default: [],
    },
    startedAt: Date,
    completedAt: Date,
  },
  {
    timestamps: true,
  },
);

taskSchema.index({ userId: 1, createdAt: -1 });

const Task = mongoose.model("Task", taskSchema);

module.exports = { Task, SUPPORTED_OPERATIONS };
