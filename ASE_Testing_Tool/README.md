# ASE Testing Tool 🧪

> End-to-end automated test suite for the **Pathfinder** platform — built with [Playwright](https://playwright.dev/) and TypeScript.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Project Structure](#project-structure)
- [Running Tests](#running-tests)
  - [Run All Tests](#run-all-tests)
  - [Run by Role](#run-by-role)
  - [Run a Single Test Case](#run-a-single-test-case)
  - [Run with Dashboard](#run-with-dashboard)
  - [Useful Flags](#useful-flags)
- [Test Cases](#test-cases)
  - [Admin Flow](#-admin-flow--admin-flowspects)
  - [Company Flow](#-company-flow--company-flowspects)
  - [Student Flow](#-student-flow--student-flowspects)
  - [Forgot Password](#-forgot-password--forgot-passwordspects)
- [Edge Cases](#edge-cases)
  - [Company Edge Cases](#-company-edge-cases--company-edge-casesspects)
  - [Student Edge Cases](#-student-edge-cases--student-edge-casesspects)
- [Test Dashboard](#test-dashboard)
- [Test Credentials](#test-credentials)
- [Troubleshooting](#troubleshooting)

---

## Project Overview

This suite covers the full user journeys for all three roles on the Pathfinder platform:

| Role | Spec File | Test Count |
|------|-----------|-----------|
| Admin | `admin-flow.spec.ts` | 12 tests |
| Company | `company-flow.spec.ts` + `company-edge-cases.spec.ts` | 18 + 25 tests |
| Student | `student-flow.spec.ts` + `student-edge-cases.spec.ts` | 9 + 31 tests |
| Forgot Password | `forgot-password.spec.ts` | 3 tests |

**Base URL:** `https://pathfinder-frontend-navy.vercel.app`  
**Browser:** Chromium (headless by default)  
**Mode:** Serial (tests run sequentially within each suite)

---

## Prerequisites

- Node.js v18 or higher
- npm v9 or higher

```bash
node --version   # v18+
npm --version    # v9+
```

---

## Installation

```bash
# 1. Clone or unzip the project
cd ASE_Testing_Tool

# 2. Install dependencies
npm install

# 3. Install Playwright browsers
npx playwright install chromium
```

---

## Project Structure

```
ASE_Testing_Tool/
├── fixtures/
│   ├── sample-cv.pdf          # CV file used in student profile tests
│   └── testData.ts            # Shared job test data
├── tests/
│   ├── admin-flow.spec.ts         # Admin happy path + company approval
│   ├── company-flow.spec.ts       # Company happy path (end-to-end)
│   ├── company-edge-cases.spec.ts # Company validation & security tests
│   ├── forgot-password.spec.ts    # Password reset flow
│   ├── student-flow.spec.ts       # Student happy path (end-to-end)
│   └── student-edge-cases.spec.ts # Student validation & security tests
├── utils/
│   └── helpers.ts             # Shared test helpers & test user data
├── generate-dashboard.ts      # Dashboard generator script
├── ASE_Test_Dashboard.html    # Generated test results dashboard
├── playwright.config.ts       # Playwright configuration
├── package.json
└── tsconfig.json
```

---

## Running Tests

### Run All Tests

```bash
npx playwright test
```

### Run by Role

```bash
# Admin tests only
npx playwright test tests/admin-flow.spec.ts --headed
npx ts-node generate-dashboard.ts
start ASE_Test_Dashboard

# Company tests only (happy path)
npx playwright test tests/company-flow.spec.ts --headed

# Company tests only (edge cases)
npx playwright test tests/company-edge-cases.spec.ts --headed

# Company all (happy path + edge cases)
npx playwright test tests/company-flow.spec.ts tests/company-edge-cases.spec.ts --headed

# Student tests only (happy path)
npx playwright test tests/student-flow.spec.ts --headed

# Student tests only (edge cases)
npx playwright test tests/student-edge-cases.spec.ts --headed

# Student all (happy path + edge cases)
npx playwright test tests/student-flow.spec.ts tests/student-edge-cases.spec.ts --headed

# Forgot password tests only
npx playwright test tests/forgot-password.spec.ts --headed
```

### Run a Single Test Case

Use the `-g` flag with the exact test case name:

```bash
# Admin
npx playwright test -g "TC-A-01: Admin Login"
npx playwright test -g "TC-A-03: View Students List"
npx playwright test -g "TC-A-08: View AI Insights Dashboard"

# Student
npx playwright test -g "TC-S-01: Student Registration"
npx playwright test -g "TC-S-05: Apply for a Job"
npx playwright test -g "TC-S-06: View ATS Score and AI Analysis"

# Company
npx playwright test -g "TC-C-01: Company Login"
npx playwright test -g "TC-C-03: Post a Job"
npx playwright test -g "TC-C-08: Company Views Applicants with AI Ranking"

# Forgot Password
npx playwright test -g "TC-FP-01: Request Password Reset Link"

# Edge cases (use exact test description)
npx playwright test -g "Wrong password shows error and stays on login page"
npx playwright test -g "XSS payload in search bar does not execute"
```

### Run with Dashboard

After any test run, generate and open the live dashboard:

```bash
# Run student tests → generate dashboard → open in browser
npx playwright test tests/student-flow.spec.ts && npx ts-node generate-dashboard.ts && start ASE_Test_Dashboard.html

# Run all tests → dashboard
npx playwright test && npx ts-node generate-dashboard.ts && start ASE_Test_Dashboard.html

# Just regenerate dashboard from last run (no re-running tests)
npx ts-node generate-dashboard.ts && start ASE_Test_Dashboard.html
```

### Useful Flags

| Flag | Description | Example |
|------|-------------|---------|
| `--headed` | Run with browser visible | `npx playwright test --headed` |
| `--debug` | Step through tests interactively | `npx playwright test --debug` |
| `--ui` | Open Playwright UI mode | `npx playwright test --ui` |
| `--reporter=html` | Generate HTML report | `npx playwright test --reporter=html` |
| `--timeout=60000` | Override timeout (ms) | `npx playwright test --timeout=60000` |
| `--retries=1` | Retry failed tests once | `npx playwright test --retries=1` |

---

## Test Cases

### 🔴 Admin Flow — `admin-flow.spec.ts`

**Test Credentials:** `admin@pathfinder.com` / `Admin@123`

All admin tests run serially. If TC-A-01 fails, all subsequent tests are skipped.

| ID | Test Case | Description |
|----|-----------|-------------|
| TC-A-01 | Admin Login | Navigate to `/admin/login`, fill credentials, verify dashboard loads with KPI grid |
| TC-A-02 | View Dashboard Analytics | Verify stats cards (Students, Companies, Jobs, Applications) and charts are visible |
| TC-A-03 | View Students List | Navigate to `/admin/students`, verify table loads, search by name, reset filters |
| TC-A-04 | Edit Student Account | Click Edit on first student, verify modal opens, close modal |
| TC-A-05 | View Companies List | Navigate to `/admin/companies`, filter by `PENDING_APPROVAL` status, reset |
| TC-A-06 | View Jobs Per Month Report | Navigate to report page, verify chart loads, apply year filter |
| TC-A-07 | View Applications Per Job Report | Navigate to report, verify chart renders |
| TC-A-08 | View AI Insights Dashboard | Navigate to `/admin/ai-insights`, verify Talent Demand and Platform Health sections |
| TC-A-09 | View Admin Profile | Navigate to profile, update name, verify success alert |
| TC-A-10 | Admin Logout | Click logout, verify redirect to landing page with Sign In visible |
| TC-A-11 | Create Pending Company Registration | Register a new company account, verify pending approval message |
| TC-A-12 | Admin Approves Company | Login as admin, filter pending companies, approve the registered company |

---

### 🟡 Company Flow — `company-flow.spec.ts`

**Test Credentials:** `company@gmail.com` / `123456789C`  
**Student used for apply step:** `student@gmail.com` / `123456789J`

This is a full end-to-end flow covering the entire company journey including a student applying and status updates.

| ID | Test Case | Description |
|----|-----------|-------------|
| TC-C-01 | Company Login | Login at `/company/login`, verify dashboard and Company Actions visible |
| TC-C-02 | Complete Company Profile | Fill company description, industry, website, location, phone — save and verify success |
| TC-C-03 | Post a Job | Fill job form (title, type, category, location, deadline), post and capture job ID |
| TC-C-04 | Company Logout | Click Sign Out, verify redirect to landing page |
| TC-C-05 | Student Login and Apply for Job | Switch to student account, find the posted job, submit application with cover letter |
| TC-C-06 | Student Logout | Student signs out |
| TC-C-07 | Company Login Again | Company re-authenticates |
| TC-C-08 | Company Views Applicants with AI Ranking | Navigate to applicants for the posted job, verify AI ranking is displayed |
| TC-C-09 | Company Views Applicant Details and Downloads CV | Open applicant profile, download CV |
| TC-C-10 | Company Updates Application Status to Shortlisted | Change application status to Shortlisted |
| TC-C-11 | Company Logout Again | Company signs out |
| TC-C-12 | Student Verifies Status Change | Student logs in, checks applications, confirms Shortlisted status |
| TC-C-13 | Student Logout | Student signs out |
| TC-C-14 | Company Login Final and Accept Application | Company logs in, changes status to Accepted |
| TC-C-15 | Company Views AI Insights Dashboard | Navigate to AI insights, verify charts and metrics load |
| TC-C-16 | Student Verifies Final Status | Student confirms Accepted status in applications |
| TC-C-17 | Student Views Saved Jobs | Student navigates to saved jobs, verifies page loads |
| TC-C-18 | Final Company Logout | Company completes the session |

---

### 🟢 Student Flow — `student-flow.spec.ts`

**Note:** A new unique student email is generated on each run via `TestHelpers.generateUniqueEmail()`.

| ID | Test Case | Description |
|----|-----------|-------------|
| TC-S-01 | Student Registration | Click Get Started → Student → fill form → verify redirect to `/student/home` |
| TC-S-02 | Student Login | Skip if already logged in from TC-S-01; otherwise login and verify home dashboard |
| TC-S-03 | Complete Student Profile with CV Upload | Fill all profile fields (basic, education, skills, career, portfolio) and upload `sample-cv.pdf` |
| TC-S-04 | Search and Browse Jobs | Search for "developer" in Colombo, save a job, view job details |
| TC-S-05 | Apply for a Job | Navigate to first job, click Apply Now, fill cover letter, submit application |
| TC-S-06 | View ATS Score and AI Analysis | Navigate to AI Career Dashboard, trigger analysis if needed, verify ATS score card |
| TC-S-07 | View Applications and Track Status | Navigate to `/student/applications`, verify applications list or empty state |
| TC-S-08 | View Saved Jobs | Navigate to `/student/saved-jobs`, verify page loads with heading |
| TC-S-09 | Student Logout | Click logout button, verify redirect to `/` with Sign In and Get Started links |

---

### 🔵 Forgot Password — `forgot-password.spec.ts`

**Test Email:** `it23596566@my.sliit.lk`

| ID | Test Case | Description |
|----|-----------|-------------|
| TC-FP-01 | Request Password Reset Link | Navigate to `/auth/forgot-password`, select Student, enter email, submit, verify success message |
| TC-FP-02 | Invalid Email Error Handling | Enter non-existent email — app shows success (security best practice: never reveals if email exists) |
| TC-FP-03 | Reset Password Page Accessibility | Navigate directly to `/auth/reset-password` without a token, verify "Invalid Reset Link" heading |

---

## Edge Cases

### 🔶 Company Edge Cases — `company-edge-cases.spec.ts`

Each suite is independent (no serial dependency between suites).

#### TC-C-EC-01 | Login — Invalid Credentials
| Test | What it checks |
|------|---------------|
| Wrong password shows error | Error alert visible, stays on `/company/login` |
| Non-existent email shows error | Error alert for unknown account |
| Empty email blocked | HTML5 validation or custom error prevents submit |
| Empty password blocked | Validation prevents submit |
| Malformed email rejected | Email without `@` rejected by browser or app |
| SQL injection does not grant access | `' OR '1'='1'` payload does not bypass login |

#### TC-C-EC-02 | Registration — Validation
| Test | What it checks |
|------|---------------|
| Duplicate email rejected | Second registration with same email shows error |
| Password mismatch shows error | Confirm password not matching triggers validation |
| Empty company name rejected | Required field validation fires |
| XSS in company name sanitized | `<script>alert("xss")</script>` does not execute |

#### TC-C-EC-03 | Job Posting — Validation
| Test | What it checks |
|------|---------------|
| Empty form shows required errors | All required fields flagged on submit |
| Past deadline rejected | Date before today is not accepted |
| XSS in job title does not execute | Script tag payload sanitized |
| Oversized description handled | 1001+ character description does not crash the app |
| Missing required field prevents submit | Form without description cannot be submitted |

#### TC-C-EC-04 | Job Management
| Test | What it checks |
|------|---------------|
| Non-existent job ID returns 404 | Direct URL to invalid ID is handled gracefully |
| Jobs list loads with no jobs | Empty state renders without crash |

#### TC-C-EC-05 | Company Profile — Validation
| Test | What it checks |
|------|---------------|
| Invalid website URL rejected | Bad URL format flagged |
| Invalid phone number flagged | Non-numeric phone handled gracefully |
| XSS in description sanitized | Script payload does not execute |
| Oversized description handled | App does not crash on very long input |

#### TC-C-EC-06 | Authorization
| Test | What it checks |
|------|---------------|
| Unauth user → `/company/dashboard` | Redirected to login |
| Unauth user → `/company/post-job` | Redirected to login |
| Unauth user → `/company/jobs` | Redirected to login |
| Company cannot access `/admin/dashboard` | Role-based access control enforced |
| Company cannot access `/student/home` | Cross-role access blocked |

#### TC-C-EC-07 | Applicant Management
| Test | What it checks |
|------|---------------|
| Applications page with no data | Page loads without crash |
| Ranked applicants page loads | AI ranking page renders without error |
| Non-existent job ID for ranking | Returns error or empty state |

---

### 🔷 Student Edge Cases — `student-edge-cases.spec.ts`

#### TC-S-EC-01 | Login — Invalid Credentials
| Test | What it checks |
|------|---------------|
| Wrong password shows error | Error visible, stays on `/student/login` |
| Non-existent email shows error | Unknown account handled |
| Empty email shows validation | Required field validation fires |
| Empty password shows validation | Required field validation fires |
| Malformed email rejected | Browser or app rejects email without `@` |
| SQL injection does not break login | `' OR '1'='1'` payload handled safely |

#### TC-S-EC-02 | Registration — Validation
| Test | What it checks |
|------|---------------|
| Duplicate email rejected | Already-registered email shows error |
| Password mismatch shows error | Confirm password validation |
| Weak password rejected | Too-short password blocked |
| Empty full name rejected | Required field validation |
| XSS in full name sanitized | Script tag in name field does not execute |

#### TC-S-EC-03 | Profile — Validation
| Test | What it checks |
|------|---------------|
| Oversized About Me handled | 1001+ chars does not crash |
| Invalid phone number handled | Bad format does not crash app |
| Invalid GitHub URL handled | Malformed URL handled gracefully |
| Non-numeric GPA handled | Letters in GPA field handled |
| Non-PDF CV rejected | Only PDF files accepted for upload |

#### TC-S-EC-04 | Job Search
| Test | What it checks |
|------|---------------|
| Gibberish query returns no results | Empty state shown, no crash |
| XSS in search bar does not execute | Script payload sanitized |
| Very long search query handled | App does not crash on huge input |
| Non-existent job ID returns error | Direct URL to bad ID handled |

#### TC-S-EC-05 | Job Application
| Test | What it checks |
|------|---------------|
| Empty cover letter handled | Application with no cover letter submits gracefully |
| Duplicate application rejected | Second application to same job blocked |
| XSS in cover letter does not execute | Script payload in cover letter sanitized |

#### TC-S-EC-06 | Authorization
| Test | What it checks |
|------|---------------|
| Unauth → `/student/home` | Redirected to login |
| Unauth → `/student/profile` | Redirected to login |
| Unauth → `/student/applications` | Redirected to login |
| Student cannot access `/admin/dashboard` | Role-based access enforced |
| Student cannot access `/company/dashboard` | Cross-role access blocked |

#### TC-S-EC-07 | AI Dashboard
| Test | What it checks |
|------|---------------|
| AI dashboard loads without CV | No crash when CV not uploaded |
| Rapid clicks on Analyze Now | No duplicate API requests triggered |

---

## Test Dashboard

The dashboard reads from `test-results/results.json` and generates a live HTML report.

### Generate dashboard after running tests

```bash
npx ts-node generate-dashboard.ts
```

Then open `ASE_Test_Dashboard.html` in your browser (double-click or use `start`).

### All-in-one commands

```bash
# All tests + dashboard
npx playwright test && npx ts-node generate-dashboard.ts && start ASE_Test_Dashboard.html

# Student only + dashboard
npx playwright test tests/student-flow.spec.ts && npx ts-node generate-dashboard.ts && start ASE_Test_Dashboard.html

# Company only + dashboard
npx playwright test tests/company-flow.spec.ts && npx ts-node generate-dashboard.ts && start ASE_Test_Dashboard.html
```

### Dashboard features

- **KPI cards** — Total / Passed / Skipped / Failed with pass rate
- **Donut chart** — Visual result distribution
- **Bar chart** — Test coverage per spec file
- **Timeline** — Execution sequence of all tests
- **Suite accordion** — Expandable per-suite breakdown with test names, status badges, durations, and error messages for failures
- **Filters** — Filter by All / Passed / Failed / Skipped

---

## Test Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@pathfinder.com` | `Admin@123` |
| Company | `company@gmail.com` | `123456789C` |
| Student | `student@gmail.com` | `123456789J` |
| Forgot Password test | `it23596566@my.sliit.lk` | *(email only)* |

> ⚠️ Student registration tests generate a **new unique email** on every run using `TestHelpers.generateUniqueEmail()`.

---

## Troubleshooting

### Tests skipped after first failure

All suites use `serial` mode. If an early test fails (e.g. TC-S-01), Playwright skips the rest. Fix the failing test, then re-run.

### `test-results/.playwright-artifacts-0` not found

Delete stale output folders and re-run:

```bash
rmdir /s /q test-results
rmdir /s /q playwright-report
npx playwright test tests/student-flow.spec.ts
```

### Dashboard shows no data / old data

Make sure tests have been run at least once so `test-results/results.json` exists:

```bash
npx playwright test tests/student-flow.spec.ts
npx ts-node generate-dashboard.ts
```

### Playwright browser not installed

```bash
npx playwright install chromium
```

### `ts-node` not found

```bash
npm install -D ts-node
```

---

*ASE Testing Tool · Pathfinder Platform · Playwright v1.40.0*