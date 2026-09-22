# MEIL ESG360 — Architecture Summary

*A high-level explanation of the technical architecture designed specifically for the hackathon judging panel.*

---

## 1. Frontend: The Profily User Experience
- **Framework:** React + Vite + TypeScript.
- **Styling:** Tailwind CSS using the custom *Profily Design System* (Navy, Blush, and Coral accents with `Cormorant Garamond` serif headings).
- **Core Principle:** "Show less. Reveal more." The interface leverages responsive side-drawers and progressive disclosure so that highly complex data lineages and regulatory mappings never overwhelm the user.
- **State & Routing:** Context API for global auth state; React Router for client-side navigation. Axios handles API communication with an interceptor pattern for global 401/403 security handling.

## 2. Backend: The Engine
- **Framework:** Node.js + Express.js + TypeScript.
- **Purpose:** A stateless, RESTful API architecture that validates data, enforces security, and triggers asynchronous jobs. 
- **Security Middleware:** Strict JWT verification, Object-Level Authorization (IDOR protection), NoSQL injection shielding, rate limiting, and `helmet` headers.

## 3. Database: MongoDB & Mongoose
- **Why MongoDB?** ESG reporting involves complex, deeply nested corporate hierarchies (Projects → Business Units → Subsidiaries → Groups). Relational tables become rigid and slow when rolling up arbitrary nodes. MongoDB's document model allows us to dynamically aggregate and consolidate millions of records seamlessly.
- **Mongoose ORM:** Enforces strict typing at the database boundary. We utilize Compound Indexes extensively to ensure real-time dashboard calculations remain fast.

## 4. The 6 Pillars of ESG Logic

### A. Authentication & RBAC (Role-Based Access Control)
Users are explicitly assigned one of 6 roles (e.g., Project Officer, Reviewer, Auditor, Admin). The backend middleware aggressively checks these roles on *every* request. A Project Officer literally cannot query another project's data, regardless of what they try to manipulate on the frontend.

### B. ESG Data Engine & Validation
Before any piece of ESG data (e.g., "Electricity Consumed") is saved, it runs through the **Validation Engine**. This ensures numeric bounds (e.g., renewable energy cannot exceed total energy) and mandates attached Evidence before the record is allowed into the system.

### C. Consolidation Engine
The core mathematical brain of the platform. Once a BU Reviewer approves a Project Officer's submission, the Consolidation pipeline fires. It aggregates the approved numbers recursively up the organizational tree. *Only* explicitly `APPROVED` records are ever counted.

### D. BRSR Mapping & Readiness
Consolidated KPIs are mapped to regulatory frameworks (SEBI BRSR Core Principles). The system dynamically calculates a "Readiness Score" based on missing data, missing evidence, and unapproved records across the entire enterprise.

### E. Data Lineage (Trace-to-Source)
Every top-level KPI on the Group Dashboard contains cryptographic foreign-keys mapping back to the individual Project records that constructed it. A judge or auditor can click a top-level corporate metric and drill down all the way to a field officer's original utility bill.

### F. Reporting, Assurance & Audit
The system natively supports an immutable **Audit Trail**, tracking the exact Actor, Action, Resource, and Timestamp for every system event. 
External Auditors have dedicated read-only accounts where they can select **Assurance Samples** and log regulatory findings without risking data corruption. Finally, the **Report Builder** snapshots the entire dataset into a finalized, immutable BRSR regulatory output.
