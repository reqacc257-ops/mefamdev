# Laravel + React migration plan

## Goal
Convert the current Node.js + Express + static HTML app into a Laravel API backend with a React frontend, deployed on Railway.

## Current state
- Backend: Node.js + Express
- Frontend: static HTML/JS files under public/
- Data store: local JSON-style store with in-memory persistence

## Target state
- Backend: Laravel PHP API
- Frontend: React SPA
- Database: MySQL or PostgreSQL on Railway

## Phase 1 — foundation
- Create a Laravel backend skeleton for auth, applications, and admin APIs.
- Create a React frontend starter for the applicant form and applicant portal.
- Add a Docker Compose setup for local development.

## Phase 2 — port core features
- Auth: staff login and applicant portal login
- Applications: submit, list, view, update status
- Families and records: move to Laravel models/controllers

## Phase 3 — UI migration
- Migrate the application form from the static HTML page to React.
- Migrate the applicant portal and admin dashboard to React views.

## Phase 4 — deployment
- Deploy the Laravel API and React frontend separately on Railway.
- Add a managed database service.
- Move storage from local JSON files to SQL tables.

## Route mapping
- POST /api/auth/login -> Laravel auth endpoint
- POST /api/auth/applicant -> Laravel applicant login endpoint
- POST /api/public/apply -> Laravel application submission endpoint
- GET /api/applications -> Laravel applications index
- PATCH /api/applications/:id -> Laravel application update
