# 2. Architectural Styles Selection for COQUI_BOT

Date: 2026-05-14

## Status

Accepted

## Context

The system requires a task management bot accessible via Telegram and a web browser,
with AI features, deployed on OCI. We evaluated the 9 architectural styles covered
in the course to determine which fit each layer.

## Decision

We apply the following styles:

| Style | Where applied |
|-------|--------------|
| **Layered (N-tier)** | Spring Boot backend (Controller → Service → Repository → DB) |
| **Event-driven** | Telegram bot long-polling loop; bot events trigger BotActions handlers |
| **Microkernel** | Bot command dispatcher: core plugin + BotActions as extension points |
| **Service-Based** | REST API exposes discrete services: /todolist, /users, /api/ai/chat |
| **Pipeline** | AI RAG pipeline: query → embedding → vector search → LLM → response |
| **Monolithic** | Single deployable JAR containing frontend + backend + bot |
| **Client-Server** | React SPA (client) ↔ Spring Boot REST API (server) |

## Consequences

- Single JAR simplifies deployment to OKE but limits independent scaling of bot vs API.
- Layered style enforces separation of concerns in backend code.
- Event-driven bot architecture decouples Telegram interaction from business logic.