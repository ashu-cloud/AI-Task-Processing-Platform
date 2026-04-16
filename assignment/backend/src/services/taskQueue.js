const { createClient } = require("redis");
const { env } = require("../config/env");

let redisClient;

async function getRedisClient() {
  if (!redisClient) {
    redisClient = createClient({ url: env.redisUrl });
    redisClient.on("error", (error) => {
      console.error("Redis connection error", error);
    });
    await redisClient.connect();
  }

  return redisClient;
}

async function enqueueTask(task) {
  const client = await getRedisClient();
  await client.lPush(
    "ai-task-jobs",
    JSON.stringify({
      taskId: task._id.toString(),
      userId: task.userId.toString(),
      operation: task.operation,
      inputText: task.inputText,
      title: task.title,
    }),
  );
}

module.exports = { enqueueTask, getRedisClient };
