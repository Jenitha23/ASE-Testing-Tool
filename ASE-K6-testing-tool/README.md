# K6 Load & Data-Driven Testing — PathFinder API

## Project Overview
Performance and functional testing suite for the **PathFinder** job-application API,
built with [K6](https://k6.io/). Two distinct K6 features are implemented, one per student.

---

## Tool & Category
| Category              | Tool |
|-----------------------|------|
| Load/Performance Testing | K6  |

---

## Division of Work

| Student   | Feature                          | File                              |
|-----------|----------------------------------|-----------------------------------|
| Student 3 | Spike / Stress Testing           | `tests/applyJobSpikeStress.test.js` |
| Student 4 | Data-Driven Payload Testing (CSV)| `tests/applyJobDataDriven.test.js`  |

---

## Project Structure

```
.
├── data/
│   └── applyJobCases.csv          # CSV test-case definitions (8 scenarios)
├── tests/
│   ├── applyJobDataDriven.test.js # Data-driven test
│   └── applyJobSpikeStress.test.js# Spike & stress test
└── README.md
```

---

## Feature 1 — Data-Driven Payload Testing (Student 4)

Loads test scenarios from a CSV file using K6's `SharedArray`. Each row drives
one iteration, covering functional correctness across 8 distinct cases:

| # | Case Name              | Scenario                                 | Expected |
|---|------------------------|------------------------------------------|----------|
| 1 | complete_profile_apply | Valid job application                    | 201      |
| 2 | apply_same_job_again   | Duplicate application                    | 409      |
| 3 | invalid_job_id         | Non-existent job ID                      | 404      |
| 4 | missing_job_id         | No jobId in payload                      | 404      |
| 5 | unauthorized_apply     | No Authorization header                  | 401      |
| 6 | invalid_token_apply    | Malformed / invalid JWT token            | 401      |
| 7 | empty_cover_letter     | Cover letter omitted (optional field)    | 201      |
| 8 | malformed_job_id       | Non-numeric jobId (type validation)      | 400      |

### Key K6 Concepts Used
- `SharedArray` — CSV loaded once, shared across all VUs (memory-efficient)
- `group()` — each scenario wrapped in a named group for clear reporting
- `check()` — 5 assertions per case (status, latency, JSON validity, code, message)
- `Trend` / `Counter` custom metrics — `apply_job_duration`, `apply_job_failed`, `apply_job_succeeded`
- `thresholds` — p95 latency + custom `apply_job_failed` count gate
- `setup()` / `teardown()` — single login before VUs start; summary on finish
- `iterations` derived from `testCases.length` — scales automatically with CSV rows

### How to Run
```bash
k6 run tests/applyJobDataDriven.test.js
```

---

## Feature 2 — Spike / Stress Testing (Student 3)

Simulates a sudden traffic spike using K6's `ramping-vus` executor across 5 stages,
validating that the API remains stable and within latency thresholds at peak load.

### Traffic Shape

```
VUs │                   ████████████
100 │               ████            █
 50 │         ██████                 █
 10 │  ███████                        █
  0 │──                                ─→ time
     0s  20s   40s      70s   90s  100s
```

| Stage | Duration | Target VUs | Purpose          |
|-------|----------|------------|------------------|
| 1     | 20 s     | 10         | Warm-up / baseline |
| 2     | 20 s     | 50         | Moderate load    |
| 3     | 30 s     | 100        | Spike to peak    |
| 4     | 20 s     | 100        | Sustained stress |
| 5     | 10 s     | 0          | Ramp-down / recovery |

### Key K6 Concepts Used
- `ramping-vus` executor — precise multi-stage traffic shaping
- `Trend` / `Rate` / `Counter` custom metrics — `spike_res_duration`, `spike_error_rate`, `spike_total_requests`
- `thresholds` — p95 latency + `spike_error_rate < 5%` + `http_req_failed{expected_response:false} < 1%`
- `group()` — "Apply Job Under Spike Load" group separates spike results
- `check()` — 5 assertions: API handled, no timeout, body exists, valid JSON, no 503/504
- Per-iteration `console.log` with VU, iteration, status, and duration for live demo narration
- `setup()` / `teardown()` lifecycle hooks

### How to Run
```bash
k6 run tests/applyJobSpikeStress.test.js
```

---

## Environment Variables (optional)

| Variable          | Default                          | Description              |
|-------------------|----------------------------------|--------------------------|
| `BASE_URL`        | (Azure URL in code)              | API base URL             |
| `STUDENT_EMAIL`   | `student@gmail.com`              | Login email              |
| `STUDENT_PASSWORD`| `123456789J`                     | Login password           |
| `JOB_ID`          | `2`                              | Job ID for spike test    |

---

## Thresholds Summary

| Metric                                      | Threshold       |
|---------------------------------------------|-----------------|
| `http_req_duration`                         | p(95) < 15 000 ms |
| `http_req_failed{expected_response:false}`  | rate < 1 %      |
| `apply_job_duration` (custom)               | p(95) < 10 000 ms |
| `apply_job_failed` (custom)                 | count < 2       |
| `spike_res_duration` (custom)               | p(95) < 15 000 ms |
| `spike_error_rate` (custom)                 | rate < 5 %      |

---

## Notes
- `409` responses are **expected** for duplicate applications — not a bug.
- `http_req_failed` is naturally high in the data-driven test because K6 counts
  all 4xx/5xx as "failed" by default; our custom `apply_job_failed` counter
  correctly distinguishes intentional vs unexpected failures.
- The spike test token is shared across all 100 VUs via `setup()` return value —
  this is intentional and correctly models a single authenticated user under load.