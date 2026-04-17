# AI Task Processing Platform

This folder contains a submission-ready implementation of the MERN stack developer intern assignment:

- Next.js frontend
- Express backend
- Python worker
- MongoDB
- Redis
- Docker and Docker Compose
- Kubernetes manifests
- Argo CD application manifest
- CI/CD workflow

## Features

- User registration and login with JWT authentication
- Password hashing with bcrypt
- Task creation with `uppercase`, `lowercase`, `reverse`, and `word_count`
- Asynchronous processing with Redis
- Task statuses: `pending`, `running`, `success`, `failed`
- Task logs and results persisted in MongoDB
- Helmet and request rate limiting on the API

## Project Structure

```text
ai-task-platform/
├── frontend/                 # Next.js app
├── backend/                  # Express API
├── worker/                   # Python worker
├── k8s/                      # Kubernetes manifests
├── argocd/                   # Argo CD application
├── .github/workflows/        # CI/CD pipeline
├── docker-compose.yml
├── .env.example
├── ARCHITECTURE.md
└── README.md
```

## Run the App

### Docker Compose

This is the recommended way to run the full stack because it starts MongoDB, Redis, backend, worker, and frontend together.

1. Open a terminal in the `assignment/` folder. Run Compose from this folder, not from the parent directory.
2. Create the root environment file from the example:

```powershell
Copy-Item .env.example .env
```

If you are using Command Prompt instead of PowerShell:

```bat
copy .env.example .env
```

3. Review the important values in `.env`:

- `MONGO_URI=mongodb://mongo:27017/ai-task-platform`
- `REDIS_URL=redis://redis:6379/0`
- `FRONTEND_URL=http://localhost:3000`
- `NEXT_PUBLIC_API_URL=http://localhost:4000/api`
- `JWT_SECRET=replace-with-a-long-random-secret`

4. Start the stack:

```bash
docker compose up --build
```

Add `-d` if you want detached mode.

5. Wait for the first build to finish. The initial run is slower because Docker pulls base images and installs dependencies.
6. Open the app:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:4000/health`
- Worker health: `http://localhost:8001/health`

7. Stop the stack when you are done:

```bash
docker compose down
```

Use `docker compose down -v` if you want to remove the MongoDB volume and start with a clean database next time.

### Manual Development

Use this if you want to run the services directly instead of Docker.

Prerequisites:

- Node.js 22+
- Python 3.11+
- MongoDB running on `localhost:27017`
- Redis running on `localhost:6379`

1. If you are not using Docker, update the root `.env` so MongoDB and Redis point to localhost:

```env
MONGO_URI=mongodb://localhost:27017/ai-task-platform
REDIS_URL=redis://localhost:6379/0
```

2. Start MongoDB and Redis locally.
3. Backend:

```bash
cd backend
npm install
npm run dev
```

The backend reads environment variables from the shell or a local `backend/.env` file. If you want to override the defaults, set `MONGO_URI`, `REDIS_URL`, `JWT_SECRET`, and `FRONTEND_URL` before starting it.

4. Frontend:

```bash
cd frontend
npm install
npm run dev
```

The frontend talks to `http://localhost:4000/api` by default. If you need a different backend URL, set `NEXT_PUBLIC_API_URL` in your shell or in `frontend/.env.local`.

5. Worker:

```bash
cd worker
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m app.main
```

If you are using Command Prompt, activate the virtual environment with `.venv\Scripts\activate.bat` instead.

If you run the app outside Docker, keep MongoDB and Redis running locally before starting the backend and worker.

## API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Tasks

- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:taskId`
- `GET /api/tasks/:taskId/logs`

## Notes

- Replace placeholder Docker image names in `k8s/platform.yaml`.
- Replace the placeholder Argo CD repo URL.
- Add your Argo CD dashboard screenshot to the final submission after deployment.
