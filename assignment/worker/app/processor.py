import json
import os
import time
from datetime import datetime, timezone

from bson import ObjectId
from pymongo import MongoClient
from redis import Redis


MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/ai-task-platform")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
DATABASE_NAME = os.getenv("MONGO_DB_NAME", "ai-task-platform")
QUEUE_NAME = os.getenv("REDIS_QUEUE_NAME", "ai-task-jobs")


def utc_now():
    return datetime.now(timezone.utc)


def transform_text(operation: str, input_text: str) -> str:
    if operation == "uppercase":
        return input_text.upper()
    if operation == "lowercase":
        return input_text.lower()
    if operation == "reverse":
        return input_text[::-1]
    if operation == "word_count":
        return str(len(input_text.split()))
    raise ValueError(f"Unsupported operation: {operation}")


def append_log(tasks_collection, task_id: ObjectId, message: str) -> None:
    tasks_collection.update_one(
        {"_id": task_id},
        {"$push": {"logs": {"message": message, "createdAt": utc_now()}}},
    )


def process_forever() -> None:
    mongo_client = MongoClient(MONGO_URI)
    redis_client = Redis.from_url(REDIS_URL, decode_responses=True)
    tasks_collection = mongo_client[DATABASE_NAME]["tasks"]

    print("Worker started and waiting for jobs...")

    while True:
        _, payload = redis_client.brpop(QUEUE_NAME)
        job = json.loads(payload)
        task_id = ObjectId(job["taskId"])

        tasks_collection.update_one(
            {"_id": task_id},
            {
                "$set": {
                    "status": "running",
                    "startedAt": utc_now(),
                    "updatedAt": utc_now(),
                }
            },
        )
        append_log(tasks_collection, task_id, "Worker picked up the task.")

        try:
            time.sleep(1)
            result = transform_text(job["operation"], job["inputText"])
            tasks_collection.update_one(
                {"_id": task_id},
                {
                    "$set": {
                        "status": "success",
                        "result": result,
                        "completedAt": utc_now(),
                        "updatedAt": utc_now(),
                        "errorMessage": "",
                    }
                },
            )
            append_log(tasks_collection, task_id, "Task completed successfully.")
        except Exception as error:  # pragma: no cover - defensive worker safety
            tasks_collection.update_one(
                {"_id": task_id},
                {
                    "$set": {
                        "status": "failed",
                        "errorMessage": str(error),
                        "completedAt": utc_now(),
                        "updatedAt": utc_now(),
                    }
                },
            )
            append_log(tasks_collection, task_id, f"Task failed: {error}")


if __name__ == "__main__":
    process_forever()
