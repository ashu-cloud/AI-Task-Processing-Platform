import os
import threading

from flask import Flask, jsonify

# Changed to absolute import for compatibility when running as a script
from app.processor import process_forever


app = Flask(__name__)


@app.get("/health")
def healthcheck():
    return jsonify({"status": "ok"})


def start_background_worker() -> None:
    thread = threading.Thread(target=process_forever, daemon=True)
    thread.start()


start_background_worker()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8001")))
