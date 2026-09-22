# MEIL ESG360 Production Checklist

This checklist must be completely verified before finalizing any production deployment of the MEIL ESG360 platform.

## 1. Application Build
- [ ] `npm run build` succeeds in the `client` directory.
- [ ] `npm run build` succeeds in the `server` directory.
- [ ] Frontend successfully deployed and reachable.
- [ ] Backend successfully deployed and reachable.
- [ ] Single Page Application (SPA) routing fallbacks (e.g., catching 404s and returning `index.html`) are configured on the frontend hosting provider.

## 2. Security Configuration
- [ ] The deployment is served exclusively over HTTPS.
- [ ] `helmet` security headers are active and verified.
- [ ] Strict CORS policy is active; it allows only the specified `FRONTEND_URL`.
- [ ] Rate limiting is active (Global limit: 1000 requests / 15 min).
- [ ] `JWT_SECRET` is strong, secure, and uniquely generated for production.
- [ ] `.env` and other secret-bearing files are explicitly ignored in version control and excluded from build artifacts.

## 3. Database Readiness
- [ ] `MONGODB_URI` points to the production MongoDB instance.
- [ ] MongoDB authentication is enabled, and the user has restricted privileges (least privilege principle).
- [ ] Compound indexes (from Phase 15 optimizations) are active and verified in the production database.
- [ ] A routine automated backup strategy is configured and documented.

## 4. Monitoring & Observability
- [ ] `GET /api/health` returns `200 OK` and correctly reflects database connectivity.
- [ ] `GET /api/health/detailed` is accessible by `ADMIN` roles and returns expected system metrics.
- [ ] `X-Request-ID` tracing is functioning; frontend API calls send it, and the backend logs it.
- [ ] Production logging is capturing `INFO`, `WARN`, and `ERROR` levels without exposing passwords, JWTs, or MongoDB credentials.
- [ ] Background job monitor correctly records job successes and failures without silent death.

## 5. Reliability & Operations
- [ ] "Fail Fast" environment validation stops the backend server from booting if critical configuration variables are missing.
- [ ] Node.js process listens for `SIGINT` and `SIGTERM` to perform a graceful shutdown (closing HTTP connections and MongoDB before exiting).
- [ ] Background jobs handle retry logic and exhibit idempotency (e.g., safe against double execution).
- [ ] Disaster recovery and rollback procedures are tested and documented.

## 6. Quality Assurance (Smoke Testing)
- [ ] Run a complete Core Workflow test (Login → Select Project → Enter Data → Validate → Submit → Approve → Check Readiness).
- [ ] Test Mobile/Responsive layout for critical views (Dashboard, Data Collection Workspace).
- [ ] Test Report generation and verify that finalized snapshots are immutable.
- [ ] Test file upload (Evidence) and verify files can be downloaded correctly.
