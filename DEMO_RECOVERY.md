# MEIL ESG360 — Demo Recovery Plan

> **CRITICAL RULE:** Do NOT attempt to debug code or rewrite business logic live during the hackathon demonstration. If an issue occurs, pivot smoothly using this recovery guide.

## 1. Login Failure
*Symptoms: Incorrect password, 401 Unauthorized, or spinner hanging on login.*
**Recovery Steps:**
1. Hard refresh the page (`Ctrl + F5` or `Cmd + Shift + R`) to clear any stale JWT state.
2. Confirm you are using the correct credentials. All accounts use the identical deterministic password: `Demo123!`
3. If an account is genuinely locked or missing, pivot immediately to the **Group ESG Team** account (`esg@meil-demo.com`) which has read access to nearly all dashboards, eliminating the need to demonstrate the Data Collection workflow live.

## 2. Live Data Entry or File Upload Fails
*Symptoms: Clicking "Submit" on a new ESG record hangs, or Multer/AWS S3 throws an error during Evidence upload.*
**Recovery Steps:**
1. Do not attempt to re-upload. Say: *"Since we are on conference Wi-Fi, let's look at a record that was submitted earlier today."*
2. Pivot directly to the **Data Lineage / Trace-to-Source** feature.
3. Open the Executive Dashboard, click a top-level KPI, and drill down to a pre-seeded, historically approved record with attached evidence. This proves the system's core value (traceability and validation) without relying on a live mutation.

## 3. Workflow Stuck (Reviewer Cannot See Submission)
*Symptoms: Officer submitted data, but the BU Reviewer dashboard shows "0 Pending Reviews".*
**Recovery Steps:**
1. This typically indicates a Role/Hierarchy mismatch (the Officer belongs to a different BU than the Reviewer you logged in as).
2. Say: *"Our strict Object-Level Authorization ensures reviewers only see data for their specific Business Unit. Let's switch to the Group ESG view to see the consolidated state."*
3. Log in as `esg@meil-demo.com` and demonstrate the Consolidated Hierarchy view instead.

## 4. Blank Dashboard / Missing Data
*Symptoms: Dashboard charts are empty or BRSR Readiness shows 0%.*
**Recovery Steps:**
1. Check the top-right filter. Ensure the correct **Reporting Period** (e.g., "FY 2023-2024") and **Organization Node** (e.g., "MEIL Group") are selected.
2. If data is genuinely gone, the database may have been wiped. Run the Demo Reseed Protocol.

## 5. Demo Reseed Protocol (Deterministic Reset)
If the demo environment is hopelessly corrupted, you can restore it to the exact canonical state in 10 seconds.
**Procedure:**
1. Open terminal on the backend server.
2. `cd server`
3. `npm run seed`
4. The script will securely drop existing collections and insert the deterministic hierarchy, roles, pre-approved ESG data, and configured BRSR mappings.
*(Note: Do this strictly as a last resort if presenting in 5 minutes).*

## 6. API Health Check Procedure
If the frontend says "Network Error", verify the backend is running.
1. Open a new tab and navigate to `http://localhost:5000/api/health`
2. You should see: `{"status": "UP", "dbState": 1, ...}`
3. If the server is down, restart it via terminal: `npm run dev` in the `/server` directory.
