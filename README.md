# PathFinder Automated Testing Suite

A complete automated testing suite for the **PathFinder Smart Internship & Job Placement System**, built with **Playwright**, **K6**, and **TypeScript**.

This project validates the PathFinder platform from two testing levels:

- **Playwright E2E / UI Testing** - checks real browser user journeys for Student, Company, Admin, and Forgot Password flows.
- **K6 Performance Testing** - checks backend API performance, spike/stress behaviour, and data-driven application submission scenarios.

---

## Features

| Feature | Tool | Test File(s) |
|---|---|---|
| Student registration, login, profile update, CV upload, job search, job application, AI analysis, saved jobs | Playwright | `ASE_Testing_Tool/tests/student-flow.spec.ts` |
| Student validation, security, authorization, duplicate application, invalid search, invalid CV upload | Playwright | `ASE_Testing_Tool/tests/student-edge-cases.spec.ts` |
| Company login, profile update, job posting, applicant view, CV download, status update, AI insights | Playwright | `ASE_Testing_Tool/tests/company-flow.spec.ts` |
| Company validation, XSS/SQL injection checks, invalid job/profile data, unauthorized access | Playwright | `ASE_Testing_Tool/tests/company-edge-cases.spec.ts` |
| Admin login, dashboard analytics, student/company management, reports, AI insights, company approval | Playwright | `ASE_Testing_Tool/tests/admin-flow.spec.ts` |
| Forgot password request, invalid email handling, reset-password page accessibility | Playwright | `ASE_Testing_Tool/tests/forgot-password.spec.ts` |
| Apply job API data-driven testing using CSV scenarios | K6 | `ASE-K6-testing-tool/tests/applyJobDataDriven.test.js` |
| Apply job API spike and stress testing up to 100 virtual users | K6 | `ASE-K6-testing-tool/tests/applyJobSpikeStress.test.js` |
| Register 100 students for load testing preparation | K6 | `ASE-K6-testing-tool/tests/registerStudents.test.js` |
| Prepare student profiles and upload sample CVs for load testing | K6 | `ASE-K6-testing-tool/tests/prepareStudents.test.js` |
| Custom HTML dashboard generation from Playwright JSON results | TypeScript | `ASE_Testing_Tool/generate-dashboard.ts` |

---

## Team & Test Coverage

| Member | Name | Tool | Feature | Test File | Tests / Scenarios |
|---|---|---|---|---|---:|
| 1 | IT23369924 - THARUMINA A V G R | Playwright | Company Happy Path | `tests/company-flow.spec.ts` | 18 |
| 1 | IT23369924 - THARUMINA A V G R | Playwright | Company Edge Cases | `tests/company-edge-cases.spec.ts` | 29 |
| 1 | IT23369924 - THARUMINA A V G R | Playwright | Forgot Password Flow | `tests/forgot-password.spec.ts` | 3 |
| 2 | IT23656956 - IMASHA M M O | Playwright | Student Happy Path | `tests/student-flow.spec.ts` | 9 |
| 2 | IT23656956 - IMASHA M M O | Playwright | Student Edge Cases | `tests/student-edge-cases.spec.ts` | 30 |
| 2 | IT23656956 - IMASHA M M O | Playwright | Admin Happy Path | `tests/admin-flow.spec.ts` | 12 |
| 3 | IT23736450 - WICKRAMAARACHCHI D S | K6 | Spike / Stress Testing | `tests/applyJobSpikeStress.test.js` | 1 performance scenario, up to 100 VUs |
| 4 | IT23596566 - JENITHA J M | K6 | Data-Driven Payload Testing | `tests/applyJobDataDriven.test.js` | 8 CSV scenarios |

**Note on test counts:** Playwright counts are based on actual `test()` declarations in each spec file. K6 data-driven scenarios are counted from `data/applyJobCases.csv`. Spike/stress testing is counted as a performance scenario because it uses staged virtual users instead of individual UI test cases.

---

## Project Structure

```text
ASE_Testing_Tool/
├── README.md
├── PathFinder_Test_Tool.pdf
├── ASE_Testing_Tool/
│   ├── .gitignore
│   ├── package.json
│   ├── package-lock.json
│   ├── tsconfig.json
│   ├── playwright.config.ts
│   ├── generate-dashboard.ts
│   ├── ASE_Test_Dashboard.html
│   ├── fixtures/
│   │   ├── sample-cv.pdf
│   │   └── testData.ts
│   ├── utils/
│   │   └── helpers.ts
│   └── tests/
│       ├── admin-flow.spec.ts
│       ├── company-flow.spec.ts
│       ├── company-edge-cases.spec.ts
│       ├── forgot-password.spec.ts
│       ├── student-flow.spec.ts
│       └── student-edge-cases.spec.ts
└── ASE-K6-testing-tool/
    ├── README.md
    ├── config/
    │   └── base.js
    ├── data/
    │   ├── applyJobCases.csv
    │   ├── sample-cv.pdf
    │   └── students.csv
    └── tests/
        ├── applyJobDataDriven.test.js
        ├── applyJobSpikeStress.test.js
        ├── prepareStudents.test.js
        └── registerStudents.test.js
```

---

## Quickstart

### 1. Prerequisites

Install the following tools before running the tests:

- Node.js 20 or later recommended
- npm
- Playwright browsers
- K6
- PathFinder frontend and backend must be accessible online or locally

The current Playwright base URL is configured as:

```text
https://pathfinder-frontend-navy.vercel.app
```

The current K6 API base URL is configured as:

```text
https://pathfinder-fqgwf0e6bvc2cmbq.southeastasia-01.azurewebsites.net
```

---

### 2. Install Playwright test dependencies

```bash
cd ASE_Testing_Tool/ASE_Testing_Tool
npm install
npx playwright install
```

---

### 3. Run all Playwright tests

```bash
npm test
```

Or run directly:

```bash
npx playwright test
```

---

### 4. Run Playwright tests with browser visible

```bash
npx playwright test --headed
```

---

### 5. Run Playwright tests in debug mode

```bash
npx playwright test --debug
```

---

### 6. Open Playwright HTML report

```bash
npx playwright show-report playwright-report
```

If port `9323` is already in use, close the existing Playwright report server or run:

```bash
npx playwright show-report playwright-report --port 9324
```

---

## Running Individual Playwright Test Files

```bash
# Student happy path
npx playwright test tests/student-flow.spec.ts

# Student edge cases
npx playwright test tests/student-edge-cases.spec.ts

# Company happy path
npx playwright test tests/company-flow.spec.ts

# Company edge cases
npx playwright test tests/company-edge-cases.spec.ts

# Admin happy path
npx playwright test tests/admin-flow.spec.ts

# Forgot password flow
npx playwright test tests/forgot-password.spec.ts
```

---

## Generate Custom Test Dashboard

After running Playwright tests, generate the custom dashboard:

```bash
npx ts-node generate-dashboard.ts
```

Then open:

```text
ASE_Test_Dashboard.html
```

The dashboard reads Playwright JSON results from:

```text
test-results/results.json
```

---

## Playwright Test Cases

### Admin Flow - `admin-flow.spec.ts`

**Test Credentials:** `admin@pathfinder.com` / `Admin@123`

| ID | Test Case | Description |
|---|---|---|
| TC-A-01 | Admin Login | Logs in as admin and verifies dashboard KPI grid |
| TC-A-02 | View Dashboard Analytics | Verifies dashboard cards and charts |
| TC-A-03 | View Students List | Opens students list, searches, and resets filters |
| TC-A-04 | Edit Student Account | Opens and closes student edit modal |
| TC-A-05 | View Companies List | Filters companies by pending approval status |
| TC-A-06 | View Jobs Per Month Report | Opens report and applies year filter |
| TC-A-07 | View Applications Per Job Report | Verifies application report chart |
| TC-A-08 | View AI Insights Dashboard | Verifies Talent Demand and Platform Health sections |
| TC-A-09 | View Admin Profile | Updates admin profile name and verifies success |
| TC-A-10 | Admin Logout | Logs out and verifies redirect |
| TC-A-11 | Create Pending Company Registration | Registers a new company with pending approval |
| TC-A-12 | Admin Approves Company | Admin approves pending company registration |

---

### Student Flow - `student-flow.spec.ts`

A unique student email is generated during the test run using `TestHelpers.generateUniqueEmail()`.

| ID | Test Case | Description |
|---|---|---|
| TC-S-01 | Student Registration | Registers a new student and verifies dashboard redirect |
| TC-S-02 | Student Login | Logs in or continues if already authenticated |
| TC-S-03 | Complete Student Profile with CV Upload | Updates student profile and uploads `sample-cv.pdf` |
| TC-S-04 | Search and Browse Jobs | Searches for jobs, saves a job, and views details |
| TC-S-05 | Apply for a Job | Applies for a selected job with a cover letter |
| TC-S-06 | View ATS Score and AI Analysis | Opens AI Career Dashboard and verifies ATS score |
| TC-S-07 | View Applications and Track Status | Checks application list and status tracking |
| TC-S-08 | View Saved Jobs | Opens saved jobs page |
| TC-S-09 | Student Logout | Logs out successfully |

---

### Company Flow - `company-flow.spec.ts`

**Test Credentials:** `company@gmail.com` / `123456789C`  
**Student Account Used:** `student@gmail.com` / `123456789J`

| ID | Test Case | Description |
|---|---|---|
| TC-C-01 | Company Login | Logs in at `/company/login` and verifies dashboard |
| TC-C-02 | Complete Company Profile | Updates company description, industry, website, location, and phone |
| TC-C-03 | Post a Job | Creates a new job and captures the job ID |
| TC-C-04 | Company Logout | Logs out from company account |
| TC-C-05 | Student Login and Apply for Job | Student finds the posted job and applies |
| TC-C-06 | Student Logout | Student logs out |
| TC-C-07 | Company Login Again | Company logs in again |
| TC-C-08 | Company Views Applicants with AI Ranking | Opens applicants page and verifies AI ranking |
| TC-C-09 | Company Views Applicant Details and Downloads CV | Opens applicant details and downloads CV |
| TC-C-10 | Company Updates Application Status to Shortlisted | Updates application status to Shortlisted |
| TC-C-11 | Company Logout Again | Company logs out again |
| TC-C-12 | Student Verifies Status Change | Student verifies Shortlisted status |
| TC-C-13 | Student Logout | Student logs out again |
| TC-C-14 | Company Login Final and Accept Application | Company changes status to Accepted |
| TC-C-15 | Company Views AI Insights Dashboard | Verifies AI insights dashboard |
| TC-C-16 | Student Verifies Final Status | Student verifies Accepted status |
| TC-C-17 | Student Views Saved Jobs | Student opens saved jobs |
| TC-C-18 | Final Company Logout | Final logout |

---

### Forgot Password - `forgot-password.spec.ts`

**Test Email:** `it23596566@my.sliit.lk`

| ID | Test Case | Description |
|---|---|---|
| TC-FP-01 | Request Password Reset Link | Submits forgot password request for Student user |
| TC-FP-02 | Invalid Email Error Handling | Enters non-existent email and verifies safe response |
| TC-FP-03 | Reset Password Page Accessibility | Opens reset password page without token and verifies invalid link message |

---

## Playwright Edge Case Coverage

### Student Edge Cases - `student-edge-cases.spec.ts`

| Area | What is Tested |
|---|---|
| Login validation | Wrong password, unknown email, empty fields, malformed email, SQL injection |
| Registration validation | Duplicate email, password mismatch, weak password, empty name, XSS payload |
| Profile validation | Oversized About Me, invalid phone, invalid GitHub URL, non-numeric GPA, invalid CV upload |
| Job search and application | Gibberish search, XSS search, long search, invalid job ID, empty cover letter, duplicate application, XSS cover letter |
| Authorization | Unauthenticated student routes, blocking student access to admin/company dashboards |
| AI dashboard | Loads without CV and handles rapid repeated Analyze clicks |

### Company Edge Cases - `company-edge-cases.spec.ts`

| Area | What is Tested |
|---|---|
| Login validation | Wrong password, unknown company email, empty fields, malformed email, SQL injection |
| Registration validation | Duplicate company email, password mismatch, empty company name, XSS company name |
| Job posting validation | Empty form, past deadline, XSS title, oversized description, missing required fields |
| Job management | Non-existent job ID and empty jobs list |
| Company profile validation | Invalid website, invalid phone, XSS description, oversized description |
| Authorization | Unauthenticated company routes and blocking company access to admin/student dashboards |
| Applicant management | Empty applications page, ranked applicants page, invalid ranked applicants job ID |

---

## Running K6 Tests

Move into the K6 folder:

```bash
cd ASE_Testing_Tool/ASE-K6-testing-tool
```

### Data-Driven Payload Test

```bash
k6 run tests/applyJobDataDriven.test.js
```

This test reads scenarios from:

```text
data/applyJobCases.csv
```

| Case Name | Scenario | Expected Status |
|---|---|---:|
| complete_profile_apply | Valid job application | 201 |
| apply_same_job_again | Duplicate application | 409 |
| invalid_job_id | Non-existent job ID | 404 |
| missing_job_id | Missing job ID | 404 |
| unauthorized_apply | No Authorization header | 401 |
| invalid_token_apply | Invalid JWT token | 401 |
| empty_cover_letter | Empty optional cover letter | 201 |
| malformed_job_id | Non-numeric job ID | 400 |

---

### Spike / Stress Test

```bash
k6 run tests/applyJobSpikeStress.test.js
```

Traffic stages:

| Stage | Duration | Target VUs | Purpose |
|---|---:|---:|---|
| 1 | 20s | 10 | Warm-up |
| 2 | 20s | 50 | Moderate load |
| 3 | 30s | 100 | Spike to peak load |
| 4 | 20s | 100 | Sustained stress |
| 5 | 10s | 0 | Ramp-down and recovery |

---

### Register 100 Test Students

```bash
k6 run tests/registerStudents.test.js
```

This script creates 100 unique student accounts for performance testing preparation.

---

### Prepare Student Profiles with CV Upload

```bash
k6 run tests/prepareStudents.test.js
```

This script logs in prepared student accounts, updates profile data, and uploads `sample-cv.pdf`.

---

## K6 Environment Variables

You can override default values using environment variables.

```bash
k6 run \
  -e BASE_URL=https://your-api-url.com \
  -e STUDENT_EMAIL=student@gmail.com \
  -e STUDENT_PASSWORD=123456789J \
  -e JOB_ID=97 \
  tests/applyJobDataDriven.test.js
```

| Variable | Description |
|---|---|
| `BASE_URL` | Backend API base URL |
| `STUDENT_EMAIL` | Student login email for API tests |
| `STUDENT_PASSWORD` | Student login password for API tests |
| `JOB_ID` | Job ID used for spike/stress apply-job test |

---

## Reports and Outputs

| Output | Description |
|---|---|
| `playwright-report/` | Playwright HTML report |
| `test-results/results.json` | JSON result file used by the custom dashboard |
| `test-results/junit.xml` | JUnit output for CI/CD tools |
| `allure-results/` | Allure report raw output |
| `ASE_Test_Dashboard.html` | Custom visual dashboard generated from test results |
| K6 terminal summary | Performance metrics, thresholds, request duration, and error rate |

---

## Key Testing Concepts Demonstrated

### Playwright

- End-to-end browser automation
- Serial test execution for dependent workflows
- Multi-role testing across Student, Company, and Admin users
- File upload testing using sample CVs
- UI validation and route authorization testing
- XSS and SQL injection input validation checks
- Screenshot, video, trace, HTML, JSON, JUnit, and Allure reporting

### K6

- API performance testing
- Spike testing and stress testing
- `ramping-vus` executor
- CSV-based data-driven testing
- `SharedArray` for efficient test data loading
- Custom metrics using `Trend`, `Rate`, and `Counter`
- Threshold validation for latency and error rate
- `setup()` authentication before virtual user execution

---

## Important Notes

- The Playwright suite targets the deployed PathFinder frontend hosted on Vercel.
- The K6 suite targets the deployed ASP.NET Core API hosted on Azure App Service.
- Some tests depend on valid existing users, jobs, and application data.
- Duplicate application responses such as `409` are expected in relevant negative test cases.
- K6 may count some 4xx responses as failed HTTP requests by default, but the custom checks separate expected negative responses from real unexpected failures.
- The `package.json` file contains repeated `scripts` keys. In JSON, the later `scripts` object overrides the earlier one. Use the commands listed in this README if any npm script is missing.

---

## Troubleshooting

### Playwright report port already in use

Error example:

```text
Error: listen EADDRINUSE: address already in use ::1:9323
```

Fix:

```bash
npx playwright show-report playwright-report --port 9324
```

Or close the previous terminal/browser report server and run again.

---

### Browser not installed

```bash
npx playwright install
```

---

### TypeScript cannot find Node or Playwright types

```bash
npm install
```

Then confirm the project has:

```text
@playwright/test
@types/node
typescript
```

---

### K6 command not recognized

Install K6 first, then verify:

```bash
k6 version
```

---

## About

This testing suite was created for the **Advanced Software Engineering (ASE)** testing assignment. It demonstrates automated UI testing, edge case testing, role-based workflow testing, data-driven API testing, and performance testing for the PathFinder platform.
