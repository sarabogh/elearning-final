# Setup Guide

This guide contains only the required setup and verification steps.

## 1. Prerequisites
- Node.js 18+
- npm
- MongoDB instance (local or Atlas)

## 2. Install
From repository root:
```bash
npm run install-all
```

## 3. Environment Configuration
Create env file:
```bash
cd server
copy .env.example .env
```

Minimum required values in `server/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/elearning
JWT_SECRET=replace-with-a-strong-secret
PORT=5001
CORS_ORIGIN=http://localhost:3000
```

Optional values:
```env
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=app-password
```

## 4. Required Folder
From repo root:
```bash
mkdir server/uploads
```

## 5. Run the App
Terminal 1 (backend):
```bash
cd server
npm run dev
```

Terminal 2 (frontend):
```bash
cd client
npm start
```

App URL: http://localhost:3000

## 6. Verify
- Register/login works
- You can open dashboard
- Course list loads
- File upload route is reachable

## 7. Run Tests
```bash
cd server
npm test
```

## 8. Production Essentials
- Set `NODE_ENV=production`
- Replace `JWT_SECRET` with a strong unique secret
- Set production `MONGODB_URI`
- Set production `CORS_ORIGIN`
- Build frontend: `cd client && npm run build`
- Deploy backend from `server`

## Troubleshooting
- MongoDB error: verify `MONGODB_URI` and database access
- CORS error: verify `CORS_ORIGIN`
- Port in use: change `PORT`
- Upload errors: ensure `server/uploads` exists
