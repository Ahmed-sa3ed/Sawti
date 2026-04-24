# صوتي (My Voice) - Arabic Voice Data Collection Platform

## Overview

A full-stack Arabic RTL web application for collecting high-quality Arabic voice recordings to train ASR (Automatic Speech Recognition) models.

pnpm workspace monorepo using TypeScript.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5 + express-session (session-based auth)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- **Build**: esbuild (CJS bundle)
- **Frontend**: React + Vite + Wouter + TailwindCSS + shadcn/ui
- **Auth**: bcrypt password hashing, express-session cookies
- **File storage**: Replit Object Storage (GCS-backed) — object path `recordings/<userId>/<sessionName>/recording_<timestamp>.wav`, stored in `DEFAULT_OBJECT_STORAGE_BUCKET_ID` bucket
- **Audio capture**: MediaRecorder API (webm/opus)

## Architecture

- `artifacts/api-server/` — Express backend (port 8080)
- `artifacts/sawti/` — React Vite frontend (port varies, proxies /api to 8080)
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/api-client-react/` — Generated React Query hooks + Zod schemas
- `lib/db/` — Drizzle schema and migrations
- `lib/api-zod/` — Zod validation schemas

## Features

### User Flows
- Login → User dashboard with session progress cards
- Recording interface: TTS playback, MediaRecorder, submit audio, navigate sentences
- Sentence suggestion form with duplicate detection

### Admin Flows
- Dashboard with stats (users, sessions, recordings, acceptance rate)
- User management: create, delete, assign sessions
- Session management: create sessions, upload sentences (tripled on upload)
- Recording review: accept/reject with audio playback via `/api/admin/recordings/:id/audio`
- Suggestion management: approve/reject
- Dataset download: ZIP with WAV files + CSV metadata

## Key Design Decisions

- Sentences are tripled on upload (3 copies per unique sentence, shuffled randomly)
- When a user is assigned to a session, they receive ~1/3 of the available sentences (uniqueCount batch)
- Rejecting a recording deletes the file from object storage (GCS)
- All text is in Arabic, RTL layout throughout
- `credentials: 'include'` on all API fetches for session cookie propagation

## Default Admin Credentials
- Username: `admin`
- Password: `admin123`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
