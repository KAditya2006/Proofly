# MEIL ESG360 — Canonical Hackathon Demo Script

> **Product Tagline:** From Project Data to BRSR-Ready Reporting.
> **Value Proposition:** MEIL ESG360 turns distributed project-level ESG data into traceable, validated, and BRSR-ready enterprise reporting.

---

## 1. Demo Roles & Accounts
All accounts use the deterministic password: `Demo123!`

- **Group ESG Team** (`esg@meil-demo.com`)
  - *Role:* Top-level dashboard, Enterprise Readiness, Report Builder, Data Lineage.
- **Project ESG Officer** (`officer@meil-demo.com`)
  - *Role:* Enters raw ESG data, uploads evidence, addresses validation errors.
- **BU Reviewer** (`reviewer@meil-demo.com`)
  - *Role:* Reviews officer submissions, validates evidence, and approves records.
- **Subsidiary ESG Manager** (`manager@meil-demo.com`)
  - *Role:* Regional/Subsidiary-level read-only analytics.
- **Auditor / Assurance User** (`auditor@meil-demo.com`)
  - *Role:* External read-only compliance checks and Assurance sampling.
- **Admin** (`admin@meil-demo.com`)
  - *Role:* System configurations, master data, observability.

---

## 2. The 5-8 Minute Deterministic Demo Journey

**Step 1: The Executive Overview (Group ESG)**
- **Open:** Login as `esg@meil-demo.com` → Executive Dashboard.
- **Action:** Show the overall BRSR Readiness Score and the Data Integrity widgets.
- **Judge Script:** *"At the highest level, MEIL executives need to know exactly how ready they are for BRSR compliance. This dashboard isn't mock data—it's mathematically aggregated from hundreds of live projects in real-time."*
- **Feature Demonstrated:** RBAC Dashboard, BRSR Readiness.

**Step 2: The Origin of Data (Project Officer)**
- **Open:** Switch to `officer@meil-demo.com` → Data Collection Workspace.
- **Action:** Select "Project P-001". Enter an electricity consumption value. Upload a PDF/Image as evidence. Trigger a validation error intentionally (e.g., negative number). Submit.
- **Judge Script:** *"But where does that data come from? Down in the field, a Project Officer submits utility usage. The system immediately validates the data and mandates cryptographic evidence before it even reaches the database."*
- **Feature Demonstrated:** Validation Engine, Evidence-backed reporting.

**Step 3: Governance & Accountability (BU Reviewer)**
- **Open:** Switch to `reviewer@meil-demo.com` → Review Workspace.
- **Action:** View the pending submission. Open the attached evidence. Click "Approve".
- **Judge Script:** *"Data means nothing without accountability. The Business Unit reviewer inspects the field data against the attached evidence. Once approved, the record is locked, timestamped, and tied immutably to this user."*
- **Feature Demonstrated:** Approval Workflow, Audit Trail.

**Step 4: Enterprise Consolidation (Group ESG)**
- **Open:** Switch back to `esg@meil-demo.com` → Executive Dashboard.
- **Action:** Show that the overall numbers have shifted slightly upwards.
- **Judge Script:** *"Now that the data is approved, the Consolidation Engine instantly triggers. It rolls the approved record up through the project, the Business Unit, the Subsidiary, and finally to the Group total. No more spreadsheet consolidation."*
- **Feature Demonstrated:** Hierarchical Consolidation, Enterprise Hierarchy.

**Step 5: Trace-to-Source (Group ESG)**
- **Open:** Executive Dashboard → Click a top-level KPI widget.
- **Action:** The Data Lineage drawer slides out. Expand the tree down to the original record and evidence.
- **Judge Script:** *"If an auditor questions a final KPI, you don't have to scramble. You can trace any consolidated number all the way back to the specific project officer's upload in one click."*
- **Feature Demonstrated:** Data Lineage / Trace-to-Source.

**Step 6: Regulatory Reporting (Group ESG)**
- **Open:** Report Builder Workspace.
- **Action:** Generate a new BRSR snapshot.
- **Judge Script:** *"Finally, the system maps all of this mathematically verified data to SEBI's BRSR principles, generating a frozen, immutable compliance snapshot ready for publication."*
- **Feature Demonstrated:** Report Generation, BRSR Mapping.

---

## 3. The Top 5 "WOW" Moments
If time is short, emphasize these strongest differentiators:
1. **Trace-to-Source Data Lineage:** Proving that the final numbers aren't a black box, but are completely traceable down to individual uploaded documents.
2. **Strict Object-Level Validation:** The engine completely blocks bad data or missing evidence *before* it can corrupt the database.
3. **Hierarchical Auto-Consolidation:** The realization that the system automatically handles the Project -> BU -> Sub -> Group math natively.
4. **Dynamic BRSR Readiness:** The percentage score is an actual calculation of data availability across the enterprise, not a hardcoded chart.
5. **Read-Only Auditor Mode:** Demonstrating that the system is built for real-world enterprise compliance by having a dedicated, secure workflow for external auditors.
