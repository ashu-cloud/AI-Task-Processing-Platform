# AI Task Processing Platform Architecture

## Overview

The platform is split into three application services and two infrastructure services:

- `frontend`: Next.js UI for authentication, task submission, and monitoring.
- `backend`: Express API for JWT auth, task creation, task listing, and queue publishing.
- `worker`: Python service that consumes Redis jobs, processes text operations, and updates MongoDB.
- `mongo`: persistent task and user storage.
- `redis`: queue broker for asynchronous task dispatch.

The flow is:

1. User registers or logs in through the frontend.
2. The frontend calls the Express API with a JWT bearer token.
3. The API stores a task with `pending` status in MongoDB.
4. The API pushes the task payload into Redis.
5. One worker replica pops the job, sets status to `running`, processes it, and writes logs and the final result back to MongoDB.
6. The frontend polls the API and renders status, logs, and output.

## Worker Scaling Strategy

The worker service is horizontally scalable because Redis queue consumption is handled with blocking pops. Each job is consumed by exactly one worker replica. Scaling from one replica to many replicas is therefore an operational concern rather than an application rewrite. In Kubernetes, scaling the `worker` deployment increases throughput linearly for CPU-light text transformations.

For production, scaling should be driven by:

- Redis queue depth
- average job age
- worker CPU and memory
- task success and failure rates

An HPA can be added using custom metrics from Redis queue depth or a sidecar exporter.

## Handling 100k Tasks Per Day

100k tasks per day is roughly 1.16 tasks per second on average, with higher burst traffic expected during working hours. The current architecture can absorb that load by:

- keeping API writes small and fast
- using Redis as a buffer between API and workers
- scaling worker replicas independently from the API
- indexing task lookups by `userId`, `status`, and `createdAt`

For higher sustained loads, recommended production upgrades are:

- Redis persistence and a highly available Redis topology
- separate MongoDB replica set with backup policy
- dead-letter queue for repeated failures
- job retry metadata and idempotency keys
- HPA for backend and worker deployments
- dedicated observability stack for latency and queue depth

## Database Indexing Strategy

Indexes in the application are designed around the most common access patterns:

- `users.email` unique index for registration and login
- `tasks.userId + createdAt` compound index for the dashboard task feed
- `tasks.status` index for operational queries and support tooling
- `tasks.operation` index for workload analysis

If reporting grows, additional compound indexes such as `status + createdAt` can support admin dashboards and cleanup jobs.

## Redis Failure Handling

If Redis becomes unavailable:

- new tasks can still be written to MongoDB but queue publishing fails
- the API marks the task as `failed` with a queue error log
- operators can requeue failed tasks after Redis is healthy again

For stronger reliability, production should add:

- Redis Sentinel or managed Redis
- retry with exponential backoff when publishing
- outbox pattern in MongoDB for eventual queue replay
- alerting on queue publish failures and queue depth

## Staging and Production Deployment

Use separate namespaces and separate Argo CD applications:

- `ai-task-platform-staging`
- `ai-task-platform-production`

Each environment should have:

- dedicated ConfigMaps and Secrets
- unique ingress hostnames
- isolated MongoDB and Redis instances
- different autoscaling limits
- different container image tags

The recommended GitOps structure is:

- application repo for source code and Dockerfiles
- infrastructure repo for Kubernetes manifests and Argo CD app definitions
- CI pipeline builds and pushes images
- CI opens or commits an infra change with the new immutable image tags
- Argo CD auto-syncs the cluster from the infra repo

## Security Notes

The current implementation includes:

- bcrypt password hashing
- JWT authentication
- Helmet headers
- rate limiting
- no hardcoded runtime secrets required when `.env` or Kubernetes secrets are used

Before production, add refresh-token rotation, audit logging, and HTTPS-only cookies if the frontend and API are same-site deployed.
