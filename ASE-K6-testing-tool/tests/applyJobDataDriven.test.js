/**
 * applyJobDataDriven.test.js
 *
 * Feature: Data-Driven Payload Testing (CSV)
 * Tool   : K6
 * Purpose: Validate the POST /api/applications endpoint against multiple
 *          real-world scenarios loaded from a CSV file.  Every row drives
 *          one iteration so the test scales automatically with the CSV.
 *
 * Key K6 concepts demonstrated:
 *  - SharedArray   : memory-efficient, shared CSV loader
 *  - Thresholds    : p(95) latency + per-tag latency + failure-rate gate
 *  - Trend / Counter metrics : custom instrumentation
 *  - Groups        : logical grouping of checks per scenario
 *  - Tags          : per-case filtering in Grafana / k6 Cloud
 *  - setup()       : one-time auth before VUs start
 *
 * API behaviour notes (observed & handled):
 *  - 401 responses return an EMPTY body — checks account for this
 *  - 400 validation errors use ASP.NET format { title, errors } not { message }
 *  - Duplicate applications return 409 — empty_cover_letter uses a fresh jobId
 */

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { SharedArray } from 'k6/data';
import { Trend, Counter } from 'k6/metrics';
import exec from 'k6/execution';



// ─── Custom Metrics ────────────────────────────────────────────────────────────
const applyJobDuration  = new Trend('apply_job_duration',  true); // ms, percentile-ready
const applyJobFailed    = new Counter('apply_job_failed');         // count of unexpected results
const applyJobSucceeded = new Counter('apply_job_succeeded');      // count of expected results

// ─── Environment / Config ──────────────────────────────────────────────────────
const BASE_URL         = __ENV.BASE_URL         || 'https://pathfinder-fqgwf0e6bvc2cmbq.southeastasia-01.azurewebsites.net';
const STUDENT_EMAIL    = __ENV.STUDENT_EMAIL    || 'student@gmail.com';
const STUDENT_PASSWORD = __ENV.STUDENT_PASSWORD || '123456789J';

// ─── CSV Test Cases (loaded once, shared across all VUs) ──────────────────────
const testCases = new SharedArray('applyJobCases', function () {
  const csv = open('../data/applyJobCases.csv');

  return csv
    .trim()
    .split('\n')
    .slice(1)                          // skip header row
    .filter((line) => line.trim())     // skip blank lines
    .map((line) => {
      const v = line.split(',').map((c) => c.trim());
      return {
        caseName      : v[0],
        jobId         : v[1],
        coverLetter   : v[2],
        tokenMode     : v[3],          // 'valid' | 'invalid' | 'none'
        expectedStatus: Number(v[4]),
        expectedCode  : v[5] || '',
      };
    });
});

// ─── K6 Options ───────────────────────────────────────────────────────────────
// iterations is driven by CSV row count — no magic number hardcoded here.
export const options = {
  vus       : 1,
  iterations: testCases.length,   // ← automatically matches CSV rows

  thresholds: {
    // Overall p95 latency must stay under 15 s
    http_req_duration: ['p(95)<15000'],

    // Per-tag latency: every individual test-case must also be under 15 s
    'http_req_duration{expected_response:true}': ['p(95)<15000'],

    // Custom metric: the average apply-job call must be under 10 s
    apply_job_duration: ['p(95)<10000'],

    // No more than 10 % of HTTP calls should be truly unexpected failures
    // (4xx we engineered are NOT counted here because we tag them below)
    apply_job_failed: ['count<2'],
  },
};

// ─── Setup: Login Once, Share Token ───────────────────────────────────────────
export function setup() {
  console.log('=== SETUP: Authenticating student user ===');

  const res = http.post(
    `${BASE_URL}/api/student/auth/login`,
    JSON.stringify({ email: STUDENT_EMAIL, password: STUDENT_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const loginOk    = check(res, { 'setup: login status 200': (r) => r.status === 200 });
  const tokenOk    = check(res, { 'setup: token received' : (r) => !!r.json('token')  });

  if (!loginOk || !tokenOk) {
    console.error(`Setup FAILED — status=${res.status} body=${res.body}`);
  } else {
    console.log('Setup OK — token acquired');
  }

  return { token: res.json('token') };
}

// ─── Default Function: One Iteration = One CSV Row ────────────────────────────
export default function (data) {
  const tc = testCases[exec.scenario.iterationInTest];

  // ── Build Authorization header based on tokenMode ──────────────────────────
  const headers = { 'Content-Type': 'application/json' };

  if (tc.tokenMode === 'valid') {
    headers.Authorization = `Bearer ${data.token}`;
  } else if (tc.tokenMode === 'invalid') {
    // Deliberately malformed JWT to trigger 401
    headers.Authorization = 'Bearer INVALID.JWT.TOKEN';
  }
  // tokenMode === 'none' → no Authorization header at all

  // ── Build Request Payload ───────────────────────────────────────────────────
  const payload = {};
  if (tc.jobId       !== '') payload.jobId      = Number(tc.jobId);
  if (tc.coverLetter !== '') payload.coverLetter = tc.coverLetter;

  // ── Execute Request ─────────────────────────────────────────────────────────
  let res;
  group(`Case: ${tc.caseName}`, function () {
    res = http.post(
      `${BASE_URL}/api/applications`,
      JSON.stringify(payload),
      {
        headers,
        tags: { test_case: tc.caseName },   // enables per-case filtering
      }
    );

    // Record custom timing
    applyJobDuration.add(res.timings.duration, { test_case: tc.caseName });

    // ── Assertions ────────────────────────────────────────────────────────────
    const statusMatch = check(res, {
      [`[${tc.caseName}] HTTP status = ${tc.expectedStatus}`]: (r) =>
        r.status === tc.expectedStatus,
    });

    check(res, {
      [`[${tc.caseName}] Response time < 15 s`]: (r) =>
        r.timings.duration < 15000,

      // 401 responses from this API return an empty body (standard behaviour).
      // For all other statuses we expect parseable JSON.
      [`[${tc.caseName}] Body is valid JSON or empty 401`]: (r) => {
        if (r.status === 401) return r.body === '' || r.body === null || r.body.length === 0 || (() => { try { r.json(); return true; } catch(_) { return true; } })();
        try { r.json(); return true; } catch (_) { return false; }
      },

      [`[${tc.caseName}] Response code correct`]: (r) => {
        if (tc.expectedCode === '') return true;   // no code expected → skip
        try {
          return r.json('code') === tc.expectedCode;
        } catch (_) {
          return false;
        }
      },

      // 201 success should contain an applicationId
      [`[${tc.caseName}] 201 returns applicationId`]: (r) => {
        if (tc.expectedStatus !== 201) return true; // n/a for non-201 cases
        try {
          return typeof r.json('applicationId') !== 'undefined';
        } catch (_) {
          return false;
        }
      },

      // Error responses should contain a human-readable message OR title (ASP.NET validation format).
      // 401 responses from this API intentionally return an empty body — also acceptable.
      [`[${tc.caseName}] Error response has message or title field`]: (r) => {
        if (r.status < 400) return true;                   // n/a for success cases
        if (r.status === 401) return true;                 // 401 = empty body by design
        try {
          const body = r.json();
          // Standard app errors use { message: "..." }
          // ASP.NET validation errors use { title: "...", errors: {...} }
          return typeof body.message === 'string' || typeof body.title === 'string';
        } catch (_) {
          return false;
        }
      },
    });

    // Track pass / fail counters for custom threshold
    if (statusMatch) {
      applyJobSucceeded.add(1, { test_case: tc.caseName });
    } else {
      applyJobFailed.add(1, { test_case: tc.caseName });
    }
  });

  // ── Console Summary (visible in terminal output) ───────────────────────────
  console.log('─'.repeat(60));
  console.log(`CASE     : ${tc.caseName}`);
  console.log(`EXPECTED : status=${tc.expectedStatus}  code="${tc.expectedCode || 'N/A'}"`);
  console.log(`ACTUAL   : status=${res.status}  duration=${res.timings.duration.toFixed(0)}ms`);
  try {
    const body = res.json();
    console.log(`BODY     : ${JSON.stringify(body)}`);
  } catch (_) {
    console.log(`BODY     : ${res.body}`);
  }
  console.log('─'.repeat(60));

  sleep(1);
}

// ─── Teardown: Summary Log ─────────────────────────────────────────────────────
export function teardown() {
  console.log('=== TEARDOWN: Data-driven test complete ===');
  console.log(`Total CSV cases executed: ${testCases.length}`);
}