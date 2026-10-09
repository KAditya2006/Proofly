# Proofly (formerly MEIL ESG360) — Project Overview

## Product Tagline
**From Project Data to BRSR-Ready Reporting.**

## Core Value Proposition
MEIL ESG360 is an enterprise ESG reporting platform for **Megha Engineering and Infrastructures Limited (MEIL)** that collects ESG data from projects, validates it, manages evidence and approvals, automatically consolidates approved data across the organization hierarchy, maps the data to BRSR requirements, tracks reporting readiness, and generates BRSR-ready reports.

The core workflow is:
**Collect → Validate → Approve → Consolidate → Trace → Report**

The system must support reporting at:
**MEIL Group → Subsidiary → Business Unit → Project**

## Technology Stack
- **Frontend:** React, Vite, TypeScript, Tailwind CSS, React Router, Context API
- **Backend:** Node.js, Express.js, TypeScript, REST APIs
- **Database:** MongoDB, Mongoose
- **Security:** JWT authentication, Role-based access control, bcrypt for password hashing

## Project Directory Structure

```text
BPUT2026/
├── client/                 # Frontend React Application
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── assets/         # Images, icons, and SVG files
│   │   ├── components/     # Reusable React components (UI elements)
│   │   ├── context/        # React Context providers (Auth, Theme)
│   │   ├── layouts/        # Page layout wrappers (Sidebar, Headers)
│   │   ├── pages/          # Individual route views (Dashboards, Workspaces)
│   │   ├── services/       # API integration functions (Axios clients)
│   │   ├── App.tsx         # Main application routing entry point
│   │   ├── index.css       # Global Tailwind CSS configurations
│   │   └── main.tsx        # React DOM rendering entry
│   ├── package.json        # Frontend dependencies and scripts
│   └── vite.config.ts      # Vite bundler configuration
│
├── server/                 # Backend Node.js/Express Application
│   ├── src/
│   │   ├── config/         # Environment, Database, and service configurations
│   │   ├── controllers/    # Request handlers for API routes
│   │   ├── middleware/     # Custom Express middlewares (Auth, Error handling)
│   │   ├── models/         # Mongoose database schemas
│   │   ├── routes/         # API endpoint definitions
│   │   ├── scripts/        # Utility scripts (Seeding, DB operations)
│   │   ├── services/       # Core business logic and integrations
│   │   ├── utils/          # Helper functions and shared utilities
│   │   └── index.ts        # Express server entry point
│   ├── tests/              # Jest integration and unit tests
│   └── package.json        # Backend dependencies and scripts
│
├── package.json            # Root workspace package (concurrently scripts)
├── README.md               # Quick start documentation
└── SEO_SETUP.md            # SEO and Search Console manual instructions
```


## Organization Hierarchy
The platform handles hierarchical data collection and consolidation mimicking the corporate structure:

```text
MEIL Group
   │
   ├── Subsidiary (e.g., MEIL Infrastructure)
   │      │
   │      ├── Business Unit (e.g., Roads & Highways)
   │      │       │
   │      │       └── Project (e.g., Project P-001)
   │      │
   │      └── Business Unit (e.g., Water Infrastructure)
   │
   └── Subsidiary (e.g., MEIL Energy)
```

## User Roles & Responsibilities

1. **Project ESG Officer:** Data entry, evidence upload, submission at the project level.
2. **Business Unit Reviewer:** Validates and approves/rejects project-level data for their BU.
3. **Subsidiary ESG Manager:** Read-only oversight, handles consolidated data for their subsidiary.
4. **Group ESG Team:** Manages entire MEIL Group, BRSR Core mapping, generates enterprise-level reports.
5. **Auditor / Assurance User:** Read-only access to approved data, evidence, and audit trails for compliance. Can select assurance samples and log findings.
6. **Admin:** Manages master data (Users, Orgs, Projects, Indicators).

## End-to-End Business Workflow
1. **Login:** Role-based redirection.
2. **Project Dashboard:** User selects a Project, Reporting Period, and ESG Indicator.
3. **Data Collection Workspace:** Officer enters value, unit, source, and uploads evidence.
4. **Validation:** System validates input against predefined rules (numeric, mandatory, logical rules).
5. **Submission & Review:** Officer submits; Reviewer approves or requests corrections.
6. **Consolidation:** Approved data automatically rolls up the hierarchy (Project → BU → Sub → Group).
7. **BRSR Mapping:** Aggregated data is mapped to BRSR Principles (Section A, Section B, P1-P9).
8. **Reporting & Audit:** Report Builder generates a final output, while an Audit Log tracks all system actions.

## Key System Features
- **Data Lineage & Reconciliation:** Ability to drill down from a consolidated Group KPI back to the specific Project ESG Record and underlying Evidence, with automated mathematical reconciliation to ensure top-level values match the sum of approved source records.
- **BRSR Readiness Score:** Dynamically calculates completeness based on data availability, evidence coverage, validation, and approval status.
- **Evidence Intelligence:** Global dashboards to track evidence coverage percentages and isolate missing documentation gaps across all projects.
- **Validation Engine:** Reusable rules to prevent erroneous data entry (e.g., Renewable Energy <= Total Energy).
- **Assurance & Compliance Hub:** Dedicated workspace for tracking BRSR Core disclosures, managing compliance controls, and allowing auditors to review sampled ESG records.
- **Bulk Upload:** Support for CSV/XLSX imports for large project datasets.

## Development Status
- **Phase 1 (Complete):** Backend structure, MongoDB connection, Mongoose schemas, and auth APIs initialized. Demo data seeded successfully.
- **Phase 2 (Complete):** React frontend foundation, Tailwind CSS configured with a minimalist enterprise theme, Authentication Context and global state, Protected Routes (Role-based), API service layer with Axios interceptors, Login screen, and Dashboard implementation.
- **Phase 3 (Complete):** Core Masters (Organizations, Projects, Reporting Periods, ESG Indicators). Developed backend RBAC-secured APIs and corresponding React hierarchical UIs and data grids.
- **Phase 4 (Complete):** ESG Data Engine (ESG Record and Evidence schemas), Data Collection Workspace, Reviewer Workspace (with approve/reject workflows), Validation Engine, internal Audit Logger, secure file uploads via Multer, and Bulk Upload UI stub.
- **Phase 5 (Complete):** Data Consolidation Engine (hierarchical roll-ups), BRSR Readiness calculations, Data Lineage Drawer (drill-down), and Report Builder foundation.
- **Phase 6 (Complete):** BRSR Core configuration & dashboard, Value Chain management, Report Builder integration (static snapshot versioning), and final Audit & Compliance data integration.
- **Phase 7 (Complete):** Production hardening & security. Removed `any` types for strict type safety, implemented strict RBAC `authorize()` guards across all routes, fortified data validation and duplicate protection, added a global Axios interceptor for 401/403 errors with UI error states, hardened the audit logger, and integrated Jest/Supertest for E2E backend testing.
- **Phase 8 (Complete):** Production Deployment, QA, and Demo Readiness. Created comprehensive hackathon `DEMO.md`, added `DEPLOYMENT.md` instructions, implemented backend `/api/health` monitoring, optimized Mongoose compound indexes, resolved Tailwind v4 production build compilation errors, and deployed a heavily expanded `seed.ts` script to generate a full suite of pre-approved realistic corporate ESG data.
- **Phase 9 (Complete):** Advanced Executive Analytics & Decision Intelligence. Implemented a fully functional Executive Dashboard with real-time BRSR Readiness, Data Quality alerts, Period-over-Period Trend Analytics, and Top Contributors breakdowns. Built an Indicator Explorer for organizational drill-down and connected backend MongoDB aggregation pipelines to enforce strict RBAC and calculate data purely from verified `APPROVED` records.
- **Phase 10 (Complete):** Regulatory-Grade BRSR Compliance, Assurance & Evidence Intelligence. Integrated advanced assurance workflows, auditor read-only compliance views, tamper-evident audit trails, and automated regulatory reporting packages aligned with SEBI BRSR Core guidelines.
- **Phase 11 (Complete):** Enterprise Workflow, Collaboration & Operational Excellence. Implemented polymorphic Task tracking, real-time Notification center, and structured Commenting engine. Built the Reporting Period Lifecycle Workspace, Task Board, Bulk Upload Workspace with data validation, and updated the Executive Dashboard to be dynamically role-aware.
- **Phase 12 (Complete):** Enterprise Reporting, Document Intelligence & Final BRSR Output Quality. Implemented snapshot-based report immutability, enterprise quality gates, and data traceability. Added a mock document renderer for report previews and handled asynchronous report exports and lifecycle states (DRAFT -> IN_REVIEW -> READY_FOR_FINALIZATION -> FINALIZED -> ARCHIVED).
- **Phase 13 (Complete):** Enterprise Governance, System Observability & Production Excellence. Implemented Admin Control Center for monitoring system health and jobs. Introduced Data Integrity endpoints, comprehensive Audit logging, `X-Request-ID` tracing, `ConfigAudit` for tracking structural changes, and Reporting Period closure checks. Built Disaster Recovery plan and idempotent background job processing.
- **Phase 14 (Complete):** Enterprise Integration, Interoperability & Production Ecosystem. Developed Integration configurations, Connectors framework (BaseConnector & DemoConnector), and the Import Service pipeline. Implemented Service Accounts with bcrypt-hashed API keys and API v1 routes for external systems. Built Admin dashboards for Integrations, Import History, and API Key management.
- **Phase 15 (Complete):** Advanced Security, Performance, Scalability & Enterprise Reliability. Implemented `helmet` security headers, strict rate limiting, and NoSQL injection protection. Enforced strict Object-Level Authorization preventing IDOR on records and projects. Optimized Mongoose schemas with compound indexes and implemented strict server-side pagination across core data fetching endpoints. Added `ErrorBoundary` and `React.lazy` to frontend modules to isolate crashes and improve initial bundle load times. Implemented graceful shutdown and idempotency controls for background jobs and imports.
- **Phase 16 (Complete):** Final UX/UI Polish, Mobile-First Optimization & Enterprise Design Consistency. Standardized the frontend design system using centralized utility classes (`.btn-primary`, `.card`, `.table-container`, etc.) in `index.css`. Redesigned mobile navigation to use a robust drawer system instead of a bottom bar. Polished key views including Dashboard, Analytics, Report Builder, and Admin Control Center to ensure a consistent, enterprise-grade, mobile-first aesthetic based on the "Show less. Reveal more" principle. Improved accessibility with larger touch targets and unified badge styling without altering underlying business logic.
- **Phase 17 (Complete):** Complete QA, End-to-End Testing, Regression Testing & Bug Hardening. Established a comprehensive backend integration test suite using `jest` and `supertest`. Implemented advanced Mongoose model mocking to isolate test runs from live database dependencies, resolving common CI/CD errors. Verified core workflows including ESG Data Engine, Hierarchical Consolidation, BRSR Readiness Scoring, Report lifecycle, and Security RBAC. Resolved minor CSS issues and generated detailed documentation artifacts (`TESTING.md`, `QA.md`, and `BUGS.md`).
- **Phase 18 (Complete):** Production Deployment, Monitoring, Reliability & Operational Readiness. Transitioned the system to a production-deployable state by enforcing "Fail Fast" environment validation on startup to prevent insecure fallbacks. Sanitized environment templates, corrected the frontend API fallback routing, and successfully generated production builds for both the Vite React application and the Express backend. Published comprehensive production configuration documentation, including a new `PRODUCTION_CHECKLIST.md` and updated backup/rollback strategies in `DEPLOYMENT.md`.
- **Phase 19 (Complete):** Final Hackathon Demo & Presentation Readiness. Completed the canonical end-to-end demonstration flow, verified deterministic demo data and role-based demo accounts, validated dashboard → ESG collection → approval → consolidation → BRSR readiness → data lineage → reporting → assurance workflows. Completed responsive/mobile demo verification, finalized demo/recovery documentation (`DEMO.md`, `DEMO_CHECKLIST.md`), and aligned presentation claims with the actual implemented system.
- **Phase 20 (Complete):** Master UI/UX Reconstruction & Frontend Implementation (Profily). Transitioning the generic visual identity into a premium, minimal, enterprise-grade reporting product. Applying "Show less. Reveal more" design philosophy, overhauling the design system with Navy/Blush palettes and Serif display typography, and enforcing strict mobile-first architecture without breaking any backend logic or existing API workflows.
- **Phase 21 (Complete):** Final UI/UX Audit, Visual Consistency, Responsive QA & Polish. Executed a global UI sweep utilizing automated scripts to systematically replace legacy `blue`/`indigo`/`primary` Tailwind tokens with the Profily design system (`brand-navy`, `brand-coral`, `brand-blush`) across 37 components and pages. Injected `Cormorant Garamond` serif typography into major headers, and verified seamless integration without introducing TypeScript compilation errors or business logic regressions.
- **Phase 22 (Complete):** Final Product Verification & Hackathon Demo Hardening. Executed a comprehensive system-wide verification against the backend logic and the new Profily design system. API integration, auth, project workflow, review workflow, consolidation, BRSR readiness, data lineage, reporting, assurance, admin, and security were strictly verified with 100% test pass rates and zero build regressions, confirming the canonical hackathon demo is stable and DEMO READY.
- **Phase 23 (Complete):** Deep Debugging, System Testing & Bug Discovery (Target: Backend, Security, Logic). Executed rigorous inspection and testing targeting backend API stability, security boundaries, RBAC authorization, and data processing logic to ensure complete operational resilience.
- **Phase 24 (Complete):** Full-System Black-Box QA, End-to-End Testing & Final Bug Hunt. Conducted a strict build verification for the frontend and automated end-to-end `jest` test suite hitting 13 test suites and 38 endpoints for the backend. Resolved a mocked test pipeline logic failure for the authorization middleware (`isAuthorizedForProject`). The system is now heavily fortified, with zero frontend TypeScript compilation errors and a 100% PASS rate across all backend test endpoints.
- **Phase 25 (Complete):** Strict Reference-Driven Frontend Reconstruction & Real SMTP Authentication. Reconstructed the entire UI based strictly on provided visual references (Welcome, Sign In, Register, Logo). Migrated from generic SaaS styles to a mobile-first, highly minimalist design system with serif hollow headings, floating bottom-border inputs, and pill-shaped primary buttons utilizing the brand's exact blush/coral color palette and gradient. Implemented a precision `<AuthCurve />` scalable SVG geometry to match the exact structural layout and proportions of the references. Implemented a complete real SMTP Email Verification flow (`nodemailer`), requiring 4-digit OTP verification prior to logging in, and updated database models and controllers to handle the strict `EMAIL_NOT_VERIFIED` lifecycle state. Resolved a critical Express 5.0 compatibility issue with `express-mongo-sanitize` and implemented an Ethereal Email fallback for local development testing.
- **Phase 26 (Complete):** Deep Authentication, Role Provisioning & RBAC Security Audit. Investigated a critical vulnerability where unauthenticated users could provision `ADMIN` accounts via public registration. Hardened the `authController` to strictly validate registration roles against an explicit safelist (`PROJECT_OFFICER`, `BUSINESS_UNIT_REVIEWER`, `SUBSIDIARY_MANAGER`, `GROUP_ESG_TEAM`, `AUDITOR`). Purged the `ADMIN` option from the frontend UI. Executed a deep API security matrix to verify that role escalation attempts are correctly rejected with `400 Bad Request`. Validated the real SMTP OTP verification lifecycle (generation, validation, expiration) directly against database states, ensuring unverified accounts cannot authenticate. Re-verified all RBAC middleware boundaries and JWT token claims to guarantee an immutable and secure role-based authorization model.
- **Phase 27 (Complete):** Deep Project ESG Officer Workflow Audit. Executed a rigorous, multi-layered security and logic audit of the core ESG data collection lifecycle (Project access -> Selection -> Data entry -> Validation -> Update -> Submit). Eliminated mass assignment vulnerabilities in `createRecord` and `updateRecord` through strict field whitelisting. Repaired critical flaws in the backend state machine by rigorously enforcing `DRAFT` status and rejecting actions on `CLOSED` or `ARCHIVED` Reporting Periods. Blocked submission bypass vectors by enforcing execution of the `validateRecord` engine inside the submission API, guaranteeing that logically invalid data (e.g. Unit mismatch, missing evidence) is caught and logged in the tamper-evident audit trail as `VALIDATION_FAILED_ON_SUBMIT`. Delivered a 100% pass rate against the security workflow matrix.
- **Phase 28 (Complete):** Deep Business Unit Reviewer Workflow Audit. Executed a thorough review and hardening of the ESG data record lifecycle for the Review stage. Implemented strict state guards across all reviewer API endpoints (`/approve`, `/reject`, `/correction`) to explicitly verify that records are in `SUBMITTED` or `UNDER_REVIEW` status, preventing state machine bypass. Enforced Reporting Period lifecycle adherence by rejecting mutations associated with `CLOSED` or `ARCHIVED` periods. Prevented Object-Level IDOR vulnerabilities by bounding reviewers to their specific `organizationId`. Standardized error handling utilizing the centralized `AppError` class for consistent REST responses. Built and executed a dedicated automated testing matrix (`reviewTestScript.js`) with a 100% pass rate, ensuring the workflow is secure, state-bound, and structurally robust against concurrency race conditions.
- **Phase 29 (Complete):** Deep Subsidiary ESG Manager Workflow Audit. Hardened the Subsidiary ESG Manager role to enforce strict hierarchical data boundaries and read-only constraints. Eliminated critical Insecure Direct Object Reference (IDOR) vulnerabilities across `analyticsController.ts`, `readinessService.ts`, and `consolidationController.ts` by ensuring that user requests for data (Projects, Business Units) strictly descend from the authenticated user's `organizationId`. Implemented a robust `asyncHandler` middleware to resolve unhandled promise rejections causing test suite flakiness. The complete backend matrix verified zero cross-tenant data leakage and 100% regression stability.
- **Phase 30 (Complete):** Deep Group ESG Team Workflow Audit. Completed the security audit for Group ESG Team. Fixed Cross-Tenant Data Leakage in globally-scoped MongoDB queries, repaired Hierarchical Resolution vulnerabilities, and enforced proper read boundaries to prevent BRSR Readiness Scope Bypass.
- **Phase 31 (Complete):** Deep Auditor / Assurance User Workflow Audit. Investigated and fixed unbounded IDOR vulnerabilities on Assurance controllers allowing auditors to query unapproved records and leak audit trails globally. Implemented strict backend sample state validation (`status: 'APPROVED'`) and fully isolated `AuditLog` retrieval using hierarchical boundaries.
- **Phase 32 (Complete):** Deep Admin / Master Data Workflow Audit. Implemented missing backend administrative CRUD APIs for Users, Organizations, Projects, Reporting Periods, and ESG Indicators. Hardened all routes with strict `ADMIN` role middleware, comprehensive `logAudit` integrations, and lifecycle dependency logic. Added robust automated test coverage (`adminMasterData.test.ts`) that verifies Master Data creation bounds, blocks unprivileged access attempts, and enforces cross-record consistency checks (e.g. duplicate financial years, invalid parent hierarchies).
- **Phase 33 (Complete):** Deep ESG Data Integrity, Consolidation & Reconciliation Audit. Exhaustively proved the accuracy and security of the core ESG data pipeline. Re-architected `consolidationService.ts` to inherit strict hierarchical boundary logic from `hierarchy.ts`, eliminating mismatch vulnerabilities between UI scope limits and backend math. Enforced global Mongoose compound indexes to physically block race-condition duplicate submissions. Delivered a rigid `consolidationTestScript.ts` matrix proving that hierarchy aggregation correctly filters strictly for `APPROVED` states, blocks `DRAFT`/`SUBMITTED` anomalies, precisely resolves math through Group/Sub/BU scopes, and accurately maps back to the origin Lineage array down to the exact node count.
- **Phase 34 (Complete):** Deep BRSR Mapping & Readiness Logic Audit. Refactored readiness math (`readinessService.ts`) and dashboard aggregation (`brsrCoreController.ts`) to strictly evaluate `APPROVED` records only, preventing unverified `DRAFT` or `SUBMITTED` records from artificially inflating enterprise reporting readiness scores. Mathematically validated cross-period data isolation and accurate completion percentages using an automated edge-case testing matrix. Successfully remediated unhandled asynchronous `AppError` promise rejections in legacy master data controllers to permanently stabilize Express.js backend connection timeouts.
- **Phase 35 (Complete):** Deep BRSR Report Generation & Snapshot Lifecycle Audit. Verified snapshot-based report immutability, enterprise quality gates, data traceability, mock document renderer previews, asynchronous report exports, and strict lifecycle state transitions (`DRAFT` -> `IN_REVIEW` -> `READY_FOR_FINALIZATION` -> `FINALIZED` -> `ARCHIVED`).
- **Phase 36 (Complete):** Final Security, Logging & Penetration Testing Audit. Transitioned to Admin-provisioned Employee ID authentication, eliminating public registration. Implemented a forced first-login password change flow, updated database schemas for `employeeId` and `mustChangePassword`, hardened middleware to reject API access without password change, safely migrated existing users, and updated UI to remove registration and require Employee ID for login.
- **Phase 37 (Complete):** Advanced System Administration & User Management Frontend. Implemented the `SystemConfiguration` and `UserManagement` React interfaces. These dedicated admin dashboards allow system administrators to manage global settings, security parameters (session timeouts, password complexity), and user accounts (Employee IDs, RBAC roles) directly from the UI without manual database interventions, fully integrating with the backend administrative CRUD APIs.
- **Phase 38 (Complete):** Final Demo Cleanup & Admin Polish. Executed a global wipe of simulated demo data to transition the environment to a clean slate (retaining only the root hierarchy and System Admin account). Resolved broken UI elements including activating the hierarchical "Add Node" functionality in Organization Management and implementing a global context-aware "Back" button across all layouts. Finalized the backend integration of `SystemConfiguration` by wiring it to a MongoDB singleton model. Corrected the base routing logic to ensure `ADMIN` users are securely diverted to the Admin Control Center instead of business dashboards upon login.
- **Phase 39 (Complete):** Access Control, Navigation Security & Strict Organizational Limits. Hardened the `AppLayout` navigation menu to strictly bound UI options to the user's role (e.g., Project Officers only see Dashboard, Projects, Collection, Bulk Upload). Enforced strict backend assignment limits across the organization hierarchy: Project Officers are limited to exactly 1 active project assignment at any time; Business Units are capped at 10 Project Officers across all active projects; and Business Unit Reviewers and Subsidiary Managers are strictly limited to 1 per node. Fixed UI state issues where non-admins could view project creation forms, completely isolating the Master Data boundaries.
- **Phase 40 (Complete):** Reviewer Workflow Expansion, Layout Polish & Final Data Cleanup. Implemented a robust "Send to Higher Authority" (Escalation) workflow for Business Unit Reviewers to pass records up the hierarchy, including the dedicated backend API endpoint (`/api/reviews/:id/escalate`), service integration, and UI implementation in `ReviewDetail`. Fixed persistent horizontal scrolling layout bugs across responsive tables (e.g., `ReviewWorkspace`). Resolved broken navigational routing (`/brsr` redirect) and missing access control allowances for reviewers checking BRSR Core metrics. Purged all placeholder/dummy BRSR configurations and ESG Indicators to ensure a clean demo environment. Executed a final TypeScript strictness cleanup (removing orphaned imports and invalid payload attributes) achieving zero frontend compilation errors.
- **Phase 41 (Complete):** Enterprise Role Lifecycle & Hierarchy Validation. Conducted a final architectural validation of cross-functional workflows. Verified Employee ID immutability during promotion/role-change cycles within the User Management admin module to enforce permanent enterprise audit trails. Validated the Subsidiary ESG Manager (`SUBSIDIARY_MANAGER`) dashboard mapping, confirming that the system correctly isolates and dynamically aggregates "Attention Required" metrics (Incomplete, Missing Evidence, Pending Approvals, Validation Errors) strictly to the authenticated manager's assigned subsidiary and its children, successfully proving zero cross-tenant data leakage in a clean environment.
- **Phase 42 (Complete):** UI/UX Polish & Responsive Sidebar Layout Fixes. Corrected the mobile sidebar navigation layout in `AppLayout.tsx` by overriding responsive hiding classes (`hidden md:flex`) from the Profily logo, ensuring brand consistency and correct visual hierarchy on mobile drawer states. Replaced legacy gray generic Tailwind styling in the `TrendChart` analytics component with the premium Profily design system (`brand-charcoal`, glassmorphism borders) to ensure visual consistency across the Subsidiary Manager dashboard.
- **Phase 43 (Complete):** Production Database Migration & MongoDB Atlas Integration. Successfully migrated the local development MongoDB database (`meil_esg360`) to a cloud-hosted MongoDB Atlas cluster. Executed a Node.js migration script to securely transfer all existing records (Users, Organizations, Audit Logs, System Settings) to the cloud without data loss. Validated Network Access (IP Whitelisting) for the Atlas cluster and updated the production `server/.env` with the active Atlas `MONGODB_URI` connection string, finalizing the database infrastructure for deployment.
- **Phase 44 (Complete):** Organizational Scale & Limit Adjustments. Removed legacy hardcoded constraints on Project Officer capacity and Business Unit scaling (previously capped at 10 POs per BU) to support large-scale enterprise deployments. Successfully seeded an enterprise-grade database containing exactly 1 Subsidiary, 25 Business Units, 25 BU Reviewers, 250 Project Officers, and 250 Active Projects (1 per PO) to prove massive scalability without breaking RBAC logic.
- **Phase 45 (Complete):** Comprehensive SEO & Public Marketing Architecture. Implemented a production-grade, lightweight React SEO system natively handling dynamic meta tags, canonical URLs, and Open Graph/Twitter structured data without heavy external dependencies. Introduced a suite of semantic public marketing pages (`Landing`, `ESGReporting`, `BRSRReporting`, `Features`, `About`, `Contact`) targeted at core search intents. Generated robust `robots.txt` and `sitemap.xml` configurations to firmly segregate public indexability from private application boundaries, explicitly blocking crawlers from all authenticated workspaces to enforce absolute data security.
- **Phase 46 (Complete):** Ultra-Premium Minimalist Redesign & Strict Organizational Constraints. Eliminated legacy card-based UI structures on public routes (`Landing`, `Login`) in favor of a flat, typography-forward minimalist aesthetic requested by stakeholders. Implemented a scroll-aware dynamic sticky header across the app layout with an enlarged brand logo. Revamped the `UserManagement` and `Projects` creation modals using a premium `rounded-4xl` design system. Refined the RBAC model by explicitly defining the 'System Administrator' as the MEIL core entity and dropping redundant roles. Implemented strict backend constraints (and visual frontend guards) ensuring 1 Project Officer can only be assigned to 1 active project at a time, and capping Business Units to a maximum of 10 Project Officers. Enabled auto-generation of sequential `ProjectCode` (e.g., PRJ-0001) at the backend controller level.
- **Phase 47 (Complete):** Complete Premium UI Component Rollout. Addressed remaining legacy UI elements across the application to ensure a cohesive, high-end user experience. Built a custom, fully animated `<PremiumSelect />` component to replace all native browser `<select>` dropdowns in `Projects.tsx` and `UserManagement.tsx`. Developed a stunning, full-screen `<PremiumLoader />` component utilizing concurrent `animate-ping`, `animate-spin`, and `animate-pulse` Tailwind utilities. Integrated the overlay loader across high-latency pages (`AnalyticsDashboard`, `UserManagement`, `AdminControlCenter`) to provide a consistent, branded loading experience in place of generic CSS spinners. Additionally, filtered the organization assignment dropdown in the Projects modal to strictly display `BUSINESS_UNIT` entities, aligning with the hierarchical rule that projects only belong to BUs.
- **Phase 48 (Complete):** Production Deployment Routing & API Bugfix. Resolved a critical "Failed to Login" error occurring exclusively in the production environment (Render). Identified that the frontend Vite build was statically baking the local development API endpoint (`http://localhost:5000/api`) into the production bundle due to `.env` resolution behavior. Enforced a strict production override in `client/src/services/api.ts` utilizing `import.meta.env.PROD` to unconditionally route all API requests to the relative `/api` endpoint, perfectly aligning with the monolithic Express server's static file serving architecture and ensuring stable cloud connectivity.
- **Phase 49 (Complete):** Organization Constraints & Role Management Enhancements. Implemented a smart gap-finding algorithm for `employeeId` generation to seamlessly recycle IDs. Updated user soft-deletion to release `email` and `employeeId` to prevent future conflicts. Strengthened role-based `projectId` filtering in the ESG Record API. Added data cleanup utilities (`deleteNonAdmins.ts`, `wipeData.js`) to securely manage test data. Enhanced frontend validation in `Organization` and `UserManagement` to enforce structural limits (max 5 BUs per subsidiary) and mandate organization selection for hierarchical roles. Restructured the `Landing` page design by centering the logo and removing the top header.
- **Phase 50 (Complete):** Dashboard Project Visibility & Database Connectivity Fixes. Resolved critical database connectivity timeouts (`querySrv ETIMEOUT`) caused by network ISP DNS blocks by reconfiguring the `.env` to use the standard MongoDB replica set URI, bypassing SRV DNS lookups. Fixed a critical backend matching bug in the Project Controller where a Project Officer's `ObjectId` was failing to match legacy string representations in the `assignedOfficers` array, ensuring 100% robust visibility of assigned projects on the Dashboard.
- **Phase 51 (Complete):** Dynamic Organization Mapping, Read-Only Logic & Automated Role Assignments. Re-engineered the user creation workflow to automatically provision structural units (Subsidiaries, Business Units) derived from their hierarchical managers during role assignment. Enforced project visibility constraints ensuring Project Officers strictly see assigned projects via robust database `ObjectId` and string matching. Formalized a production-ready data destruction script (`wipeData.js`) for secure test environment tear-downs. Continued to enforce the 'Proofly' branding architecture across UI/UX components.
- **Phase 52 (Complete):** Comprehensive BPUT PS08 KT Compliance & GHG Calculation Engine. Performed a deep audit against the original hackathon KT requirements. Implemented a native GHG Calculation Engine (Activity Data × Emission Factor = CO₂e) directly into the `ESGRecord` and `ESGIndicator` models. Updated the `ESGCollectionWorkspace` to feature an intelligent GHG form for Scope 1/2/3 parameters. Enhanced the `validationEngine` with Year-on-Year (YoY) `VARIANCE_MAX` threshold checks. Seeded realistic BRSR Section C configurations (e.g., CEA India Grid Emission Factors) for seamless demonstration.
- **Phase 53 (Complete):** Core UI/UX Stabilization & Dashboard Workflow Fixes. Addressed critical UI/UX anomalies in the Project Officer and System Configuration layouts. Replaced all remaining native browser `<select>` dropdowns in the ESG Data Collection Workspace with custom `<PremiumSelect>` components for a unified enterprise aesthetic. Resolved 403 Forbidden authorization errors in task APIs by correcting middleware sequence (`protect`) and role typings. Established seamless drill-down navigation from the PO Dashboard directly into the ESG Collection Workspace via interactive project cards, and stabilized mobile responsive padding and flex alignments across the System Configuration panel.
- **Phase 54 (Complete):** Business Unit Workflow Stabilization & Mobile Layout Fortification. Hardened the Business Unit Reviewer lifecycle in `ReviewDetail.tsx` by explicitly blocking action buttons once a record transitions to `UNDER_REVIEW`, preventing redundant validation loops. Eliminated all horizontal scrolling defects across data tables by converting `ReviewWorkspace` into a dual-view system (Desktop Tables / Mobile Stacked Cards). Fortified `AppLayout.tsx` with strict `h-[100dvh]` constraints to isolate scroll contexts and lock the navigation header. Cleaned up the Executive Dashboard by purging dummy BRSR Core linkages and aligning the 'Overall System Readiness' card with live, verified data logic.
- **Phase 55 (Complete):** Codebase Sanitization, Strict TypeScript Compliance & Authentication UI Polish. Executed a comprehensive repository scrub, successfully terminating over 20 extraneous debugging and test scripts (e.g., `check_db.ts`, `replace_alerts.js`, arbitrary markdown logs) generated during iterative AI development cycles, resulting in a significantly cleaner project directory. Engineered strict TypeScript interface alignment in the frontend, manually resolving hidden type incompatibilities in `Dashboard.tsx` (`analyticsPromises`) and `ReviewDetail.tsx` (interface casting), achieving a perfect 100% `tsc --noEmit` build compilation pass rate for both client and server boundaries. Polished the Login authentication workflow by implementing a dynamic `Eye/EyeOff` password visibility toggle integrated directly with the 'Proofly' SVG iconography system.
- **Phase 56 (Complete):** Subsidiary Dashboard Testing, Evidence Standardization & Production Environment Fixes. Resolved 404 file access errors by correctly routing `process.cwd()` for static `/uploads` in Express. Standardized evidence management by automatically renaming uploads to `[ProjectName]_[IndicatorName].[ext]` prior to server transmission. Rectified hardcoded local URLs (e.g., `localhost:5000`) on production builds utilizing `import.meta.env.PROD` for dynamic fallback. Re-engineered `hierarchy.ts` to properly evaluate `businessUnitId` and `subsidiaryId`, successfully unblocking missing "APPROVED" projects from rendering on the Subsidiary Analytics dashboard. Solidified workflow state locks by hiding validation action buttons in `ReviewDetail` when the record is strictly in the `CORRECTION_REQUIRED` state.
- **Phase 57 (Complete):** Deep Auditor Role Audit & Compliance UI Polish. Hardened the `AUDITOR` role dashboard by hiding irrelevant operational 'Attention Required' metrics to provide a clean, compliance-focused overview. Clarified the backend assurance logic ensuring approved records do not bypass sampling boundaries. Redesigned the `AssuranceWorkspace` and `ComplianceDashboard` (Audit & Compliance Center) to fully utilize the premium Proofly glassmorphic design system, removing legacy Tailwind components and aligning typography and colors.
- **Phase 58 (Complete):** Advanced Role-Based Email Notifications & Security Hardening. Integrated a robust `emailService` via `nodemailer` utilizing secure environment variables. Replaced static dummy passwords with dynamically generated, cryptographically secure temporary credentials sent directly to users upon account creation, significantly hardening access controls. Implemented automated workflow notification emails mapped to `reviewController` actions, ensuring users receive instant alerts upon 'Approve', 'Reject', or 'Correction Required' events. Developed a 'Forgot Password' flow featuring a premium recovery UI that issues secure temporary access credentials and enforces a mandatory change upon the next login.
- **Phase 59 (Complete):** Organizational Network Visibility & Hierarchy Mapping. Created a dedicated "My Network" feature accessible via the main sidebar, enabling users to visualize their organizational standing. The frontend leverages the Proofly glassmorphic design system to render a top-down reporting hierarchy structure. The backend (`organizationController.ts`) dynamically resolves `parentId` and descendant trees recursively, providing a secure, context-aware organizational chart where users only see their direct reporting chain (who they report to) and their subordinate entities (who reports to them), along with assigned key personnel.
- **Phase 60 (Complete):** Enterprise Report Exporting Engine (PDF & Excel). Implemented a robust client-side export utility leveraging `xlsx`, `jspdf`, and `html2canvas`. Integrated one-click "Export to PDF" and "Export to Excel" buttons directly into the `AnalyticsDashboard` and `BRSRCore` dashboards. The Excel exporter dynamically formats active Key Performance Indicators (KPIs) into structured `.xlsx` workbooks for raw data analysis, while the PDF exporter takes high-resolution canvas snapshots of the active DOM, enabling pixel-perfect, beautifully formatted management reports suitable for executive distribution.




## Frontend Pages

The application includes the following frontend pages, each serving a specific role in the ESG reporting lifecycle:

- **About**: Public marketing page detailing MEIL ESG360's corporate mission.
- **AdminControlCenter**: Central dashboard for administrators to monitor system health, jobs, and system configurations.
- **AnalyticsDashboard**: High-level analytics and trend visualizations for enterprise ESG data.
- **AssuranceWorkspace**: Dedicated workspace for auditors to review sampled ESG records and log findings.
- **AuditSearch**: Interface for searching and filtering the tamper-evident audit logs.
- **BRSRCore**: Dashboard focusing specifically on BRSR Core disclosures and compliance metrics.
- **BRSRReporting**: Public marketing page focusing on SEBI BRSR compliance features.
- **BulkUpload**: Interface for uploading large datasets of ESG data via CSV or XLSX formats.
- **BulkUploadWorkspace**: Workspace to manage, validate, and process batch data uploads.
- **ComplianceDashboard**: Overview of organizational compliance status, controls, and readiness.
- **Contact**: Public support and contact information page.
- **Dashboard**: Role-aware main dashboard providing quick access to tasks, status, and relevant metrics.
- **ESGCollectionWorkspace**: Workspace for Project ESG Officers to input values, attach evidence, and submit records.
- **ESGHub**: Central hub for exploring and managing the catalog of ESG indicators.
- **ESGReporting**: Public marketing page detailing enterprise ESG software capabilities.
- **EvidenceIntelligence**: Global dashboard to track evidence coverage and isolate missing documentation gaps.
- **Features**: Public marketing page highlighting data lineage, consolidation, and assurance.
- **FirstLoginPasswordChange**: Mandatory security page enforcing users to change their auto-generated password upon their first login before accessing the dashboard.
- **ImportBatches**: Interface for managing and reviewing batches of data imported from external systems.
- **IndicatorExplorer**: Analytical tool for drilling down into specific ESG indicators across the organization hierarchy.
- **IntegrationDetail**: Detailed configuration and status view for individual external system integrations.
- **IntegrationHub**: Central hub for managing third-party integrations, data pipelines, and external connectors.
- **Landing**: The main public homepage introducing the platform.
- **Login**: User authentication and secure login entry point using Employee ID.
- **NotFound**: A strict no-index 404 error page preventing invalid URL crawling.
- **NotificationCenter**: Centralized inbox for user notifications, alerts, and system-generated messages.
- **Organization**: Administrative interface for managing the MEIL organizational hierarchy (Group, Subsidiary, Business Unit).
- **Projects**: Interface for creating, viewing, and managing individual MEIL infrastructure projects.
- **ReportArchive**: Repository for viewing, retrieving, and downloading finalized BRSR reports.
- **ReportBuilder**: Interface for generating, configuring, and previewing comprehensive BRSR reports.
- **ReportingPeriodWorkspace**: Lifecycle management for reporting periods (Draft, Active, Closed, Archived).
- **ReportingSetup**: Interface for configuring initial reporting parameters and templates.
- **ReviewDetail**: Granular view for Reviewers to examine specific ESG record submissions, including data history and evidence.
- **ReviewWorkspace**: Workflow interface for Business Unit Reviewers to validate, approve, or reject submitted ESG data.
- **ServiceAccounts**: Interface for managing API keys and service accounts used in system-to-system integrations.
- **SystemConfiguration**: Interface for managing global system settings, security parameters, and maintenance modes.
- **TaskBoard**: Collaborative Kanban-style board for tracking team tasks and workflows.
- **UserManagement**: Interface for creating and managing user accounts, roles, and employee IDs.
- **ValueChainDashboard**: Dashboard dedicated to tracking and managing ESG metrics across the external value chain.
- **Welcome**: Initial onboarding or welcome screen for authenticated users.

### Page Distribution by Organization Role

Based on the organization hierarchy, the pages map to each organizational level and their respective roles as follows:

**1. Project Level (Role: Project ESG Officer)**
*For users collecting and submitting raw ESG data at the individual project level.*
- **ESGCollectionWorkspace**: For data entry and evidence upload.
- **BulkUpload**: For uploading raw data via CSV/XLSX.
- **BulkUploadWorkspace**: For validating and processing bulk uploads.

**2. Business Unit Level (Role: Business Unit Reviewer)**
*For reviewers who validate and approve the data submitted by projects within their BU.*
- **ReviewWorkspace**: Dashboard to see all pending submissions for the BU.
- **ReviewDetail**: Granular view for reviewing a specific record's evidence before approving/rejecting.

**3. Subsidiary Level (Role: Subsidiary ESG Manager)**
*Provides read-only oversight and aggregated analytics for all BUs and Projects under a specific subsidiary.*
- **AnalyticsDashboard**: Filtered to show trends and analytics for their specific subsidiary.
- **IndicatorExplorer**: Used to drill down into specific ESG metrics within their subsidiary.
- **EvidenceIntelligence**: To track missing documentation gaps across their subsidiary's projects.

**4. MEIL Group Level (Role: Group ESG Team)**
*For the corporate team managing the entire enterprise, BRSR mapping, and final report generation.*
- **AnalyticsDashboard**: Full enterprise-wide data view.
- **BRSRCore**: Dashboard specifically for SEBI BRSR Core disclosures.
- **ValueChainDashboard**: For managing value chain partner metrics.
- **ReportBuilder**: For generating and previewing the final BRSR reports.
- **ReportArchive**: For accessing finalized reports.
- **ReportingPeriodWorkspace**: To open, close, and manage financial reporting periods.

**5. Audit & Compliance Level (Role: Auditor / Assurance User)**
*For external or internal auditors performing read-only assurance on the approved data.*
- **AssuranceWorkspace**: For auditors to sample approved data and log findings.
- **ComplianceDashboard**: For tracking overall compliance controls and status.

**6. System Administration Level (Role: Admin)**
*For system administrators managing master data, health, and integrations.*
- **AdminControlCenter**: System health and job monitoring.
- **SystemConfiguration**: For managing global system settings and security parameters.
- **UserManagement**: For creating and managing user accounts and roles.
- **AuditSearch**: To search the tamper-evident system logs.
- **IntegrationHub** & **IntegrationDetail**: For managing external system connectors.
- **ImportBatches**: For monitoring automated data imports.
- **ServiceAccounts**: For managing API keys.
- **Organization**, **Projects**, **ReportingSetup**, **ESGHub**: Master data management pages.

**7. Global / Cross-Organizational Pages (All Authenticated Users)**
*Accessible by everyone but filter data based on the user's role.*
- **Dashboard**: Role-aware landing page with quick tasks and metrics.
- **TaskBoard**: Kanban board for ESG collaboration.
- **NotificationCenter**: System alerts and messages.
- **FirstLoginPasswordChange**: Security interstitial requiring password change on first login.
- **Welcome**: Initial onboarding or welcome screen for authenticated users.

**8. Public / Pre-Authentication Pages (Unauthenticated)**
- **Landing**, **About**, **Features**, **ESGReporting**, **BRSRReporting**, **Contact**: Semantic marketing pages optimized for search engines.
- **Login**: Authentication entry (via Employee ID).
- **NotFound**: 404 error page.
