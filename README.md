# eLearning Management System

MERN-based learning platform with role-based access, course workflows, enrollment approvals, and real-time course chat.

## What You Need
- Node.js 18+
- npm
- MongoDB (local or Atlas)

## Quick Start
1. Install dependencies:
```bash
npm run install-all
```
2. Create server env file:
```bash
cd server
copy .env.example .env
```
3. Start both apps (from repo root):
```bash
npm run dev
```
4. Open:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5001/api

## Core Features
- Authentication with roles: learner, faculty, admin
- Course creation and editing for faculty/admin
- Admin approval before course appears in catalog
- Enrollment request workflow with admin approval
- Assignments, tests, projects, ratings, and progress tracking
- Course chat and private reminders/calendar events

## Project Structure
```text
client/   React app
server/   Express API + Mongo models/controllers/routes
```

## Useful Commands
From repo root:
- `npm run dev` - run client and server together
- `npm run server` - run backend only
- `npm run client` - run frontend only
- `npm run install-all` - install server and client dependencies

From server:
- `npm test` - run API tests
- `npm run e2e:assessment` - assessment flow script

From client:
- `npm run build` - production frontend build

## Environment Variables
Use `server/.env.example` as the source of truth.

Required (minimum):
- `MONGODB_URI`
- `JWT_SECRET`
- `PORT`
- `CORS_ORIGIN`

Optional but recommended:
- `EMAIL_USER`
- `EMAIL_PASSWORD`

## Deployment Notes
- Set `NODE_ENV=production`
- Set production `MONGODB_URI`, `JWT_SECRET`, and `CORS_ORIGIN`
- Build frontend with `npm run build` in `client`
- Deploy backend from `server`

## Additional Docs
- [SETUP_GUIDE.md](./SETUP_GUIDE.md) - step-by-step setup and troubleshooting
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) - full endpoint reference
- [QUICK_START.md](./QUICK_START.md) - short bootstrap checklist
