# MEIL ESG360 — Deployment Guide

## Production Environment Setup

MEIL ESG360 consists of a Node.js Express backend and a React (Vite) frontend.

### 1. Database
- **MongoDB Atlas** or a production MongoDB cluster is required.
- Ensure network access is configured to allow your backend IP.

### 2. Backend Environment Variables (`server/.env`)
Create a `.env` file in the `server` directory based on `.env.example`:
```env
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/meil_esg_prod?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_production_key_here
JWT_EXPIRES_IN=24h
CORS_ORIGIN=https://your-frontend-domain.com
UPLOAD_DIR=./uploads
```

### 3. Frontend Environment Variables (`client/.env`)
Create a `.env` file in the `client` directory:
```env
VITE_API_URL=https://your-backend-domain.com/api
```

---

## Production Build & Start

### Backend
1. Install dependencies (ignoring dev dependencies for smaller footprint):
   ```bash
   cd server
   npm install --omit=dev --legacy-peer-deps
   ```
2. Build the TypeScript source:
   ```bash
   npm run build
   ```
3. Start the server (Node / PM2 / Docker):
   ```bash
   npm run start
   ```
   *(Note: For production resilience, we recommend using PM2: `pm2 start dist/index.js --name "meil-esg-api"`)*

### Frontend
1. Install dependencies:
   ```bash
   cd client
   npm install
   ```
2. Build the static bundle:
   ```bash
   npm run build
   ```
3. Host the output directory (`dist/`) using a web server like Nginx, Apache, or a managed service like Vercel/Netlify.
   *Note: Ensure your web server is configured to rewrite all routes to `index.html` to support React Router's SPA routing.*

---

## Post-Deployment Health Check
- Verify Backend: `GET https://your-backend-domain.com/api/health` should return `{"status":"ok"}`.
- Verify Frontend: Navigate to `https://your-frontend-domain.com` and log in with the admin account.

## Backup & Recovery

- **Database:** Ensure automated daily snapshots are enabled on your MongoDB Atlas cluster with at least a 30-day retention policy. Test the restoration procedure in a lower environment quarterly.
- **File System:** Back up the filesystem `uploads/` directory continuously to prevent evidence loss (or configure a cloud blob storage provider like AWS S3 to replace local Multer storage in future enterprise iterations).
- **Disaster Recovery:** A detailed step-by-step recovery process for application and database failure is available in [DISASTER_RECOVERY.md](DISASTER_RECOVERY.md).

## Rollback Procedure

In the event of a deployment failure (e.g. fatal startup crashes, unresolvable DB connection issues, critical frontend regressions):
1. **Application Rollback:** Re-deploy the previously known-good container image or build artifact. 
2. **Environment Variables:** Maintain version-controlled `.env` templates and revert to the previous configuration version if needed.
3. **Database Rollback:** Unless explicitly safe or accompanied by a destructive migration (which is discouraged in this architecture), avoid database rollbacks. Utilize backward-compatible schema changes wherever possible.
4. **Post-Rollback Smoke Test:** Run the `GET /api/health` check and a critical path test (Login -> Verify Dashboard) to confirm stability.

## Production Configuration (Fail Fast)

> [!CAUTION]
> As of Phase 18, the backend utilizes **Fail Fast** environment validation on startup. The server will actively refuse to boot if `MONGODB_URI`, `JWT_SECRET`, or `FRONTEND_URL` (in production) are missing from the environment. This is a deliberate safety mechanism to prevent production deployments with silent dev-mode fallbacks.
