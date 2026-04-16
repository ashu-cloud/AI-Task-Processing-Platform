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

## Local Development

1. Copy `.env.example` to `.env`.
2. Start the full stack:

```bash
docker compose up --build
```

3. Open:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:4000/health`
- Worker health: `http://localhost:8001/health`

## Manual Service Startup

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Worker

```bash
cd worker
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m app.main
```

Make sure MongoDB and Redis are running locally if you start services outside Docker Compose.

## API Endpoints

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`

### Tasks

- `GET /api/tasks`
- `POST /api/tasks`
- `GET /api/tasks/:taskId`
- `GET /api/tasks/:taskId/logs`

## Kubernetes Deployment

Apply manifests:

```bash
kubectl apply -f k8s/platform.yaml
```

The manifest includes:

- namespace
- ConfigMap and Secret
- deployments and services for MongoDB, Redis, backend, worker, and frontend
- ingress
- liveness and readiness probes
- resource requests and limits

## Argo CD

The file `argocd/application.yaml` defines an Argo CD application with automated sync, prune, and self-heal enabled. In a real submission, the `k8s/` folder should live in a dedicated infrastructure repository and the `repoURL` should point to that repo.

## CI/CD

The GitHub Actions workflow:

- installs dependencies
- runs lint checks
- builds the frontend
- builds Docker images
- pushes images on `main`
- updates the infrastructure repository with the new image tags

Required GitHub secrets:

- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `INFRA_REPOSITORY`
- `INFRA_REPOSITORY_TOKEN`

## Notes

- Replace placeholder Docker image names in `k8s/platform.yaml`.
- Replace the placeholder Argo CD repo URL.
- Add your Argo CD dashboard screenshot to the final submission after deployment.
