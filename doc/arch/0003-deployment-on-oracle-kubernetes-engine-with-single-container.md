# 3. Deployment on Oracle Kubernetes Engine with Single Container

Date: 2026-05-14

## Status

Accepted

## Context

The team has 5 OCI accounts with limited credits. We need a deployment strategy
that minimizes cost while supporting the full stack (React + Spring Boot + Telegram bot + Oracle ATP).

## Decision

Deploy everything as a single Docker container (Spring Boot JAR with embedded React)
on OKE (namespace: mtdrworkshop), using a shared cluster owned by Esteban.
Oracle ATP (Always Free tier, 20GB) serves as the database.
The Anthropic Claude API key is stored as a Kubernetes Secret.

## Consequences

- Single image simplifies CI/CD: one build.sh, one OCIR push.
- OCI Always Free ATP avoids DB charges.
- Cannot scale frontend independently from backend.
- All team members depend on Esteban's cluster availability.
- Must coordinate OCIR image updates across the team.
