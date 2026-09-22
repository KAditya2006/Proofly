# Phase 23 Deep Debugging & Bug Discovery

## Discovered and Fixed Bugs

### 1. `AuditLog` Validation CastError (Severity: Medium)
**Location**: `tests/review.test.ts`, `tests/evidence.test.ts`, `tests/validation.test.ts`
**Issue**: Mongoose `CastError` was being thrown during `AuditLog` creation when testing the deletion of evidence and reviewing records. The test suite was passing dummy strings (`'rec1'`, `'ev1'`, `'user1'`, `'reviewer1'`) as ObjectIds, which violated Mongoose's strict schema enforcement for `ObjectId` fields (`userId`, `entityId`).
**Fix**: Updated test suites to use valid 24-character hexadecimal Mongoose `ObjectId` strings (`'507f1f77bcf86cd799439011'`, etc.) for mocked documents, resolving the validation failure.

### 2. IDOR Vulnerability in Review Endpoints (Severity: High)
**Location**: `src/controllers/reviewController.ts`
**Issue**: The `approveSubmission`, `requestCorrection`, and `rejectSubmission` endpoints lacked Insecure Direct Object Reference (IDOR) protection. A reviewer or manager could potentially approve or reject an ESG Record belonging to a Project outside of their scope/organization.
**Fix**: Exported the `isAuthorizedForProject` middleware helper from `esgRecordController.ts` and integrated it into all review controller endpoints. The system now validates that `req.user` has authorization for the target `projectId` before allowing status transitions.

### 3. Incomplete Validation Engine Logic (Severity: Medium)
**Location**: `src/utils/validationEngine.ts`
**Issue**: The validation engine was only performing basic schema checks (required fields, basic numeric/boolean types) and checking for evidence on numeric entries. It completely ignored the dynamic `validationRules` array configured on the `ESGIndicator` model (e.g., `NUMERIC_MIN`, `NUMERIC_MAX`, `LOGICAL`), including cross-indicator logical checks (like `value <= ENV-EN-01`).
**Fix**: Implemented the dynamic validation rule evaluator inside `validateRecord()`. Added logic to process `NUMERIC_MIN` and `NUMERIC_MAX`. Added cross-indicator logical evaluation to evaluate expressions like `value <= targetIndicatorCode` by lazy-loading `ESGRecord` and fetching the target indicator's approved value for the given reporting period and project.

### 4. Mongoose Document Save Mock Timeout (Severity: Low)
**Location**: `src/controllers/reportController.ts`
**Issue**: The `exportReport` function timed out during testing because calling `.save()` on a mocked Mongoose model (`Job`) failed to resolve correctly in the test environment, causing Jest to hang or force exit.
**Fix**: Refactored the job status update logic from `job.save()` to `Job.updateOne({ _id: job._id }, { status: 'COMPLETED' })`. This atomic operation avoids Mongoose prototype dependency in the mock environment while improving production atomicity. (Fixed by previous agent).

## Unresolved Bugs / Known Limitations
- None. The system has passed the full suite of end-to-end and unit tests.
