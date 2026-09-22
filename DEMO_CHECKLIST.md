# MEIL ESG360 Demo Checklist

Follow this checklist strictly to ensure a flawless hackathon presentation. Do not leave these items until the last minute.

## 1. Before Demo (Pre-Flight Checks)
- [ ] **Database Connection:** Verified the server connects successfully to the Demo database.
- [ ] **Backend Health:** `GET /api/health` returns `200 OK`.
- [ ] **Frontend Health:** The application loads quickly without 404s or console errors.
- [ ] **Demo Accounts Verified:** `officer@meil-demo.com`, `reviewer@meil-demo.com`, and `esg@meil-demo.com` can log in successfully.
- [ ] **Seed Data Verified:** Projects, Business Units, and Subsidiaries populate correctly in dropdowns.
- [ ] **Dashboard Populated:** The Group ESG Dashboard shows meaningful consolidation metrics (not empty or 0%).
- [ ] **Report Available:** At least one finalized report snapshot exists in the Report Builder.
- [ ] **Audit Data Available:** The Audit Trail shows recent historical activity.

## 2. During Demo (The Core Flow)
- [ ] **Login:** Successfully log in as Project ESG Officer.
- [ ] **ESG Data:** Submit a new ESG record with an attached evidence file.
- [ ] **Validation:** (Optional) Show the validation engine catching an error.
- [ ] **Approval:** Log in as BU Reviewer and approve the submitted record.
- [ ] **Consolidation:** Log in as Group ESG and show the Dashboard KPI update.
- [ ] **Lineage:** Drill down from the Group KPI back to the original submitted record.
- [ ] **Readiness:** Show the BRSR Readiness percentage.
- [ ] **Report:** Open Report Builder and generate/view a snapshot.
- [ ] **Assurance:** Show the Audit Trail to prove immutability.

## 3. Backup & Recovery Preparedness
- [ ] **Fallback Browser:** Have a secondary incognito window already logged in as `esg@meil-demo.com` pointing to the Data Lineage view.
- [ ] **Demo URL:** Bookmark the live URL (and a localhost fallback if applicable).
- [ ] **Seed Instructions:** Memorize `npm run seed` in the `server` directory for an emergency reset.
- [ ] **Local Backup:** Ensure a local version is built and ready in case internet drops.
- [ ] **Visual Backup:** Have a pre-recorded 2-minute video or high-quality screenshots ready on the desktop.
