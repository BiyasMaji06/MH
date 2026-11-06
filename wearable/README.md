# MumWise Wearables & Health Data — Starter

Stack:
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL
- Charts: Recharts

This is a development starter. It uses simulated connection state and demo data; it does NOT connect to real Apple HealthKit, Android Health Connect, Bluetooth devices, or manufacturer APIs.

## Requirements
- Node.js 20+
- PostgreSQL 14+

## 1. Configure the database
Create a PostgreSQL database, for example `mumwise`.

```sql
CREATE DATABASE mumwise;
```

## 2. Start the backend

```bash
cd backend
cp .env.example .env
# Update DATABASE_URL in .env
npm install
npm run db:init
npm run dev
```

Backend default: http://localhost:4000

## 3. Start the frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend default: http://localhost:5173

## API endpoints
- `GET /api/health`
- `GET /api/devices`
- `POST /api/devices/demo-connect`
- `POST /api/devices/:id/disconnect`
- `GET /api/measurements?metric=heart_rate&days=7`
- `POST /api/measurements` (demo/manual ingestion endpoint)
- `GET /api/consent`
- `POST /api/consent`
- `GET /api/clinician-summary?days=7`

## Before production
1. Add real authentication and role-based access control. The starter intentionally does not implement login.
2. Scope every query to the authenticated patient/clinician. Never trust a client-supplied patient ID.
3. Use HTTPS, secrets management, rate limiting, request validation, and monitoring.
4. Complete privacy, retention, deletion, consent, and audit policies.
5. Implement native HealthKit/Health Connect adapters in a mobile app or companion app.
6. Have clinicians validate summary definitions and any alert rules.
7. Do not use demo/manual ingestion as a trusted clinical data source.
