import * as fs from 'fs';
import * as path from 'path';

// ─── Read real test results ───────────────────────────────────────────────────
const resultsPath = path.join(__dirname, 'test-results', 'results.json');

if (!fs.existsSync(resultsPath)) {
  console.error('❌  test-results/results.json not found. Run tests first.');
  process.exit(1);
}

const raw = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));

// ─── Parse helpers ────────────────────────────────────────────────────────────
interface TestCase {
  title: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut';
  duration: number;
  error?: string;
}

interface Suite {
  name: string;
  file: string;
  passed: TestCase[];
  failed: TestCase[];
  skipped: TestCase[];
}

function extractTests(suites: any[], parentFile = ''): Suite[] {
  const result: Suite[] = [];

  for (const suite of suites) {
    const file = suite.file || parentFile || suite.title || '';
    const suiteName = suite.title || '';

    const tests: TestCase[] = [];
    for (const spec of (suite.specs || [])) {
      for (const test of (spec.tests || [])) {
        const res = test.results?.[0] || {};
        const status: TestCase['status'] =
          test.status === 'expected' ? 'passed' :
          test.status === 'skipped'  ? 'skipped' :
          test.status === 'timedOut' ? 'timedOut' : 'failed';

        tests.push({
          title: spec.title,
          status,
          duration: res.duration || 0,
          error: res.error?.message || undefined,
        });
      }
    }

    if (tests.length > 0) {
      result.push({
        name: suiteName,
        file: path.basename(file),
        passed:  tests.filter(t => t.status === 'passed'),
        failed:  tests.filter(t => t.status === 'failed' || t.status === 'timedOut'),
        skipped: tests.filter(t => t.status === 'skipped'),
      });
    }

    if (suite.suites?.length) {
      result.push(...extractTests(suite.suites, file));
    }
  }

  return result;
}

const suites = extractTests(raw.suites || []);
const stats  = raw.stats || {};

const totalPassed  = suites.reduce((n, s) => n + s.passed.length, 0);
const totalFailed  = suites.reduce((n, s) => n + s.failed.length, 0);
const totalSkipped = suites.reduce((n, s) => n + s.skipped.length, 0);
const totalTests   = totalPassed + totalFailed + totalSkipped;
const passRate     = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';
const duration     = ((stats.duration || 0) / 1000).toFixed(1);
const runDate      = stats.startTime
  ? new Date(stats.startTime).toLocaleString('en-GB', { timeZone: 'Asia/Colombo', hour12: false })
  : new Date().toLocaleString();

// ─── Build per-file bar data ──────────────────────────────────────────────────
const fileGroups: Record<string, { passed: number; failed: number; skipped: number }> = {};
for (const s of suites) {
  if (!fileGroups[s.file]) fileGroups[s.file] = { passed: 0, failed: 0, skipped: 0 };
  fileGroups[s.file].passed  += s.passed.length;
  fileGroups[s.file].failed  += s.failed.length;
  fileGroups[s.file].skipped += s.skipped.length;
}

// ─── Inline JSON for the page ─────────────────────────────────────────────────
const suiteJson     = JSON.stringify(suites);
const fileGroupJson = JSON.stringify(fileGroups);

// ─── Donut arc calc ───────────────────────────────────────────────────────────
const circ       = 2 * Math.PI * 52; // ≈ 326.7
const passArc    = totalTests > 0 ? (totalPassed  / totalTests) * circ : 0;
const failArc    = totalTests > 0 ? (totalFailed  / totalTests) * circ : 0;
const skipArc    = totalTests > 0 ? (totalSkipped / totalTests) * circ : 0;
const passOffset = 0;
const failOffset = -(passArc);
const skipOffset = -(passArc + failArc);

// ─── Generate HTML ────────────────────────────────────────────────────────────
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>ASE Testing Tool — Test Results Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@400;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,300&display=swap" rel="stylesheet">
<style>
  :root {
    --bg:#0a0c10;--surface:#111318;--surface2:#181c24;--border:#222733;
    --accent:#4ade80;--accent2:#60a5fa;--warn:#fbbf24;--danger:#f87171;
    --skip:#94a3b8;--text:#e2e8f0;--muted:#64748b;
  }
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--text);min-height:100vh;overflow-x:hidden;}
  body::before{content:'';position:fixed;inset:0;background:radial-gradient(ellipse 60% 40% at 10% 10%,rgba(74,222,128,.04) 0%,transparent 60%),radial-gradient(ellipse 40% 60% at 90% 80%,rgba(96,165,250,.04) 0%,transparent 60%);pointer-events:none;z-index:0;}
  .container{max-width:1280px;margin:0 auto;padding:0 32px;position:relative;z-index:1;}
  header{padding:40px 0 32px;border-bottom:1px solid var(--border);margin-bottom:40px;}
  .header-inner{display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:16px;}
  .logo-area h1{font-family:'Syne',sans-serif;font-weight:800;font-size:28px;letter-spacing:-.5px;color:#fff;}
  .logo-area h1 span{color:var(--accent);}
  .logo-area p{font-family:'DM Mono',monospace;font-size:12px;color:var(--muted);margin-top:4px;letter-spacing:.5px;}
  .run-meta{text-align:right;font-family:'DM Mono',monospace;font-size:12px;color:var(--muted);line-height:1.8;}
  .run-meta strong{color:var(--accent);font-weight:500;}
  .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:40px;}
  @media(max-width:900px){.kpi-grid{grid-template-columns:repeat(2,1fr);}}
  .kpi-card{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:24px;position:relative;overflow:hidden;transition:border-color .2s,transform .2s;animation:fadeUp .5s ease both;}
  .kpi-card:hover{transform:translateY(-2px);border-color:rgba(255,255,255,.1);}
  .kpi-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;}
  .kpi-card.pass::before{background:linear-gradient(90deg,var(--accent),transparent);}
  .kpi-card.skip::before{background:linear-gradient(90deg,var(--skip),transparent);}
  .kpi-card.fail::before{background:linear-gradient(90deg,var(--danger),transparent);}
  .kpi-card.total::before{background:linear-gradient(90deg,var(--accent2),transparent);}
  .kpi-card:nth-child(1){animation-delay:.05s;}.kpi-card:nth-child(2){animation-delay:.10s;}.kpi-card:nth-child(3){animation-delay:.15s;}.kpi-card:nth-child(4){animation-delay:.20s;}
  .kpi-label{font-family:'DM Mono',monospace;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:var(--muted);margin-bottom:12px;}
  .kpi-value{font-family:'Syne',sans-serif;font-size:48px;font-weight:800;line-height:1;margin-bottom:8px;}
  .kpi-card.pass .kpi-value{color:var(--accent);}.kpi-card.skip .kpi-value{color:var(--skip);}.kpi-card.fail .kpi-value{color:var(--danger);}.kpi-card.total .kpi-value{color:var(--accent2);}
  .kpi-sub{font-size:13px;color:var(--muted);font-weight:300;}
  .chart-row{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:40px;}
  @media(max-width:800px){.chart-row{grid-template-columns:1fr;}}
  .chart-panel{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:28px;}
  .chart-title{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:var(--text);margin-bottom:24px;letter-spacing:-.2px;}
  .donut-wrap{display:flex;align-items:center;gap:32px;flex-wrap:wrap;}
  .donut-legend{display:flex;flex-direction:column;gap:12px;}
  .legend-item{display:flex;align-items:center;gap:10px;font-size:13px;}
  .legend-dot{width:10px;height:10px;border-radius:3px;flex-shrink:0;}
  .legend-label{color:var(--muted);}
  .legend-count{font-family:'DM Mono',monospace;font-weight:500;color:var(--text);margin-left:auto;padding-left:16px;}
  .bar-chart{display:flex;flex-direction:column;gap:12px;}
  .bar-row{display:flex;align-items:center;gap:12px;}
  .bar-label{font-size:11px;font-family:'DM Mono',monospace;color:var(--muted);width:110px;flex-shrink:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
  .bar-track{flex:1;height:24px;background:var(--surface2);border-radius:6px;overflow:hidden;display:flex;}
  .bar-fill-pass{height:100%;background:linear-gradient(90deg,#16a34a,#4ade80);}
  .bar-fill-fail{height:100%;background:linear-gradient(90deg,#991b1b,#f87171);}
  .bar-fill-skip{height:100%;background:linear-gradient(90deg,#475569,#94a3b8);}
  .bar-count{font-family:'DM Mono',monospace;font-size:11px;color:var(--muted);width:30px;text-align:right;flex-shrink:0;}
  .section-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px;}
  .section-title{font-family:'Syne',sans-serif;font-size:20px;font-weight:700;letter-spacing:-.3px;}
  .filter-tabs{display:flex;gap:8px;}
  .filter-tab{padding:6px 14px;border-radius:8px;font-size:12px;font-family:'DM Mono',monospace;cursor:pointer;border:1px solid var(--border);background:transparent;color:var(--muted);transition:all .2s;}
  .filter-tab.active,.filter-tab:hover{background:var(--surface2);color:var(--text);border-color:rgba(255,255,255,.1);}
  .filter-tab.active{color:var(--accent);border-color:rgba(74,222,128,.3);}
  .suite-list{display:flex;flex-direction:column;gap:12px;margin-bottom:60px;}
  .suite-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;overflow:hidden;transition:border-color .2s;animation:fadeUp .5s ease both;}
  .suite-card:hover{border-color:rgba(255,255,255,.08);}
  .suite-header{display:flex;align-items:center;justify-content:space-between;padding:18px 24px;cursor:pointer;user-select:none;gap:12px;}
  .suite-header:hover{background:rgba(255,255,255,.02);}
  .suite-name{font-family:'Syne',sans-serif;font-size:14px;font-weight:600;flex:1;min-width:0;}
  .suite-pills{display:flex;gap:8px;flex-wrap:wrap;flex-shrink:0;}
  .pill{font-family:'DM Mono',monospace;font-size:11px;padding:3px 10px;border-radius:20px;font-weight:500;}
  .pill-pass{background:rgba(74,222,128,.12);color:var(--accent);}
  .pill-skip{background:rgba(148,163,184,.08);color:var(--skip);}
  .pill-fail{background:rgba(248,113,113,.12);color:var(--danger);}
  .suite-progress{width:80px;height:4px;background:var(--surface2);border-radius:2px;overflow:hidden;flex-shrink:0;}
  .suite-progress-fill{height:100%;background:var(--accent);border-radius:2px;}
  .chevron{color:var(--muted);transition:transform .2s;flex-shrink:0;font-size:16px;}
  .suite-card.open .chevron{transform:rotate(180deg);}
  .suite-body{display:none;padding:0 24px 20px;border-top:1px solid var(--border);}
  .suite-card.open .suite-body{display:block;}
  .test-list{display:flex;flex-direction:column;gap:4px;padding-top:16px;}
  .test-row{display:flex;align-items:flex-start;gap:12px;padding:9px 12px;border-radius:8px;font-size:13px;transition:background .15s;}
  .test-row:hover{background:rgba(255,255,255,.03);}
  .test-row.skip-row{opacity:.6;}
  .test-row.fail-row{background:rgba(248,113,113,.04);}
  .test-icon{width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;font-weight:700;margin-top:1px;}
  .icon-pass{background:rgba(74,222,128,.15);color:var(--accent);}
  .icon-skip{background:rgba(148,163,184,.1);color:var(--skip);}
  .icon-fail{background:rgba(248,113,113,.15);color:var(--danger);}
  .test-info{flex:1;min-width:0;}
  .test-name{color:var(--text);font-weight:300;}
  .test-error{font-family:'DM Mono',monospace;font-size:11px;color:var(--danger);margin-top:4px;white-space:pre-wrap;word-break:break-word;opacity:.8;}
  .test-duration{font-family:'DM Mono',monospace;font-size:11px;color:var(--muted);flex-shrink:0;margin-top:1px;}
  .status-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-family:'DM Mono',monospace;font-size:10px;font-weight:500;letter-spacing:.5px;text-transform:uppercase;flex-shrink:0;margin-top:1px;}
  .badge-pass{background:rgba(74,222,128,.12);color:var(--accent);border:1px solid rgba(74,222,128,.25);}
  .badge-skip{background:rgba(148,163,184,.08);color:var(--skip);border:1px solid rgba(148,163,184,.18);}
  .badge-fail{background:rgba(248,113,113,.12);color:var(--danger);border:1px solid rgba(248,113,113,.25);}
  .timeline-bar{display:flex;height:36px;border-radius:8px;overflow:hidden;gap:1px;margin-bottom:12px;}
  .timeline-seg{flex:1;min-width:2px;cursor:default;transition:filter .2s;}
  .timeline-seg:hover{filter:brightness(1.4);}
  .seg-pass{background:#166534;}.seg-fail{background:#7f1d1d;}.seg-skip{background:#1e293b;}
  .timeline-legend{display:flex;gap:24px;font-size:12px;color:var(--muted);}
  .tl-legend-item{display:flex;align-items:center;gap:8px;}
  .tl-swatch{width:12px;height:12px;border-radius:3px;}
  footer{border-top:1px solid var(--border);padding:24px 0;text-align:center;font-size:12px;color:var(--muted);font-family:'DM Mono',monospace;}
  @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:translateY(0);}}
</style>
</head>
<body>
<div class="container">

  <header>
    <div class="header-inner">
      <div class="logo-area">
        <h1>ASE Testing<span>.</span></h1>
        <p>PATHFINDER PLATFORM · PLAYWRIGHT TEST SUITE · LIVE RESULTS</p>
      </div>
      <div class="run-meta">
        <div><strong>RUN DATE</strong>&nbsp;&nbsp;${runDate}</div>
        <div><strong>DURATION</strong>&nbsp;&nbsp;${duration}s</div>
        <div><strong>ENVIRONMENT</strong>&nbsp;&nbsp;Chromium · Headless</div>
        <div><strong>BASE URL</strong>&nbsp;&nbsp;pathfinder-frontend-navy.vercel.app</div>
      </div>
    </div>
  </header>

  <div class="kpi-grid">
    <div class="kpi-card total">
      <div class="kpi-label">Total Tests</div>
      <div class="kpi-value">${totalTests}</div>
      <div class="kpi-sub">Across all spec files</div>
    </div>
    <div class="kpi-card pass">
      <div class="kpi-label">Passed</div>
      <div class="kpi-value">${totalPassed}</div>
      <div class="kpi-sub">${passRate}% pass rate</div>
    </div>
    <div class="kpi-card skip">
      <div class="kpi-label">Skipped</div>
      <div class="kpi-value">${totalSkipped}</div>
      <div class="kpi-sub">${totalTests > 0 ? ((totalSkipped/totalTests)*100).toFixed(1) : 0}% of total</div>
    </div>
    <div class="kpi-card fail">
      <div class="kpi-label">Failed</div>
      <div class="kpi-value">${totalFailed}</div>
      <div class="kpi-sub">${totalFailed === 0 ? 'No failures' : 'Needs attention'}</div>
    </div>
  </div>

  <div class="chart-row">
    <div class="chart-panel">
      <div class="chart-title">Result Distribution</div>
      <div class="donut-wrap">
        <svg width="140" height="140" viewBox="0 0 140 140" style="flex-shrink:0">
          <circle cx="70" cy="70" r="52" fill="none" stroke="#1e293b" stroke-width="20"/>
          <circle cx="70" cy="70" r="52" fill="none" stroke="#4ade80" stroke-width="20"
            stroke-dasharray="${passArc.toFixed(1)} ${(circ - passArc).toFixed(1)}"
            stroke-dashoffset="${passOffset.toFixed(1)}"
            transform="rotate(-90 70 70)"/>
          <circle cx="70" cy="70" r="52" fill="none" stroke="#f87171" stroke-width="20"
            stroke-dasharray="${failArc.toFixed(1)} ${(circ - failArc).toFixed(1)}"
            stroke-dashoffset="${failOffset.toFixed(1)}"
            transform="rotate(-90 70 70)"/>
          <circle cx="70" cy="70" r="52" fill="none" stroke="#475569" stroke-width="20"
            stroke-dasharray="${skipArc.toFixed(1)} ${(circ - skipArc).toFixed(1)}"
            stroke-dashoffset="${skipOffset.toFixed(1)}"
            transform="rotate(-90 70 70)"/>
          <text x="70" y="65" text-anchor="middle" fill="#e2e8f0" font-family="Syne" font-size="22" font-weight="800">${passRate}%</text>
          <text x="70" y="82" text-anchor="middle" fill="#64748b" font-family="DM Sans" font-size="10">Pass Rate</text>
        </svg>
        <div class="donut-legend">
          <div class="legend-item"><div class="legend-dot" style="background:#4ade80"></div><span class="legend-label">Passed</span><span class="legend-count">${totalPassed}</span></div>
          <div class="legend-item"><div class="legend-dot" style="background:#f87171"></div><span class="legend-label">Failed</span><span class="legend-count">${totalFailed}</span></div>
          <div class="legend-item"><div class="legend-dot" style="background:#475569"></div><span class="legend-label">Skipped</span><span class="legend-count">${totalSkipped}</span></div>
          <div class="legend-item" style="margin-top:8px;padding-top:8px;border-top:1px solid #222733;"><div class="legend-dot" style="background:#60a5fa"></div><span class="legend-label">Total</span><span class="legend-count">${totalTests}</span></div>
        </div>
      </div>
    </div>
    <div class="chart-panel">
      <div class="chart-title">Coverage by Spec File</div>
      <div id="barChart"></div>
    </div>
  </div>

  <div style="margin-bottom:40px;">
    <div class="chart-panel">
      <div class="chart-title">Test Execution Sequence</div>
      <div class="timeline-bar" id="timeline"></div>
      <div class="timeline-legend">
        <div class="tl-legend-item"><div class="tl-swatch" style="background:#166534"></div><span>Passed (${totalPassed})</span></div>
        <div class="tl-legend-item"><div class="tl-swatch" style="background:#7f1d1d"></div><span>Failed (${totalFailed})</span></div>
        <div class="tl-legend-item"><div class="tl-swatch" style="background:#1e293b"></div><span>Skipped (${totalSkipped})</span></div>
      </div>
    </div>
  </div>

  <div class="section-header">
    <div class="section-title">Test Suite Breakdown</div>
    <div class="filter-tabs">
      <button class="filter-tab active" onclick="filterSuites('all',this)">All</button>
      <button class="filter-tab" onclick="filterSuites('pass',this)">Passed</button>
      <button class="filter-tab" onclick="filterSuites('fail',this)">Failed</button>
      <button class="filter-tab" onclick="filterSuites('skip',this)">Skipped Only</button>
    </div>
  </div>
  <div class="suite-list" id="suiteList"></div>

</div>
<footer>
  <div class="container">
    ASE Testing Tool · Playwright · Generated ${runDate} · ${totalTests} tests · ${passRate}% pass rate
  </div>
</footer>

<script>
const SUITES = ${suiteJson};
const FILE_GROUPS = ${fileGroupJson};
const TOTAL = ${totalTests};

// Bar chart
const fileLabels = {
  'admin-flow.spec.ts':'Admin Flow',
  'company-edge-cases.spec.ts':'Company Edge',
  'company-flow.spec.ts':'Company Flow',
  'forgot-password.spec.ts':'Forgot Pwd',
  'student-edge-cases.spec.ts':'Student Edge',
  'student-flow.spec.ts':'Student Flow'
};
const barEl = document.getElementById('barChart');
barEl.style.cssText = 'display:flex;flex-direction:column;gap:12px;';
Object.entries(FILE_GROUPS).forEach(([file, counts]) => {
  const total = counts.passed + counts.failed + counts.skipped;
  const pw = TOTAL > 0 ? (counts.passed / TOTAL * 100).toFixed(1) : 0;
  const fw = TOTAL > 0 ? (counts.failed / TOTAL * 100).toFixed(1) : 0;
  const sw = TOTAL > 0 ? (counts.skipped / TOTAL * 100).toFixed(1) : 0;
  barEl.innerHTML += \`<div class="bar-row">
    <div class="bar-label" title="\${file}">\${fileLabels[file]||file}</div>
    <div class="bar-track">
      <div class="bar-fill-pass" style="width:\${pw}%" title="Passed: \${counts.passed}"></div>
      <div class="bar-fill-fail" style="width:\${fw}%" title="Failed: \${counts.failed}"></div>
      <div class="bar-fill-skip" style="width:\${sw}%" title="Skipped: \${counts.skipped}"></div>
    </div>
    <div class="bar-count">\${total}</div>
  </div>\`;
});

// Timeline
const tl = document.getElementById('timeline');
SUITES.forEach(s => {
  s.passed.forEach(t  => { const d=document.createElement('div'); d.className='timeline-seg seg-pass'; d.title=t.title+' · PASSED';  tl.appendChild(d); });
  s.failed.forEach(t  => { const d=document.createElement('div'); d.className='timeline-seg seg-fail'; d.title=t.title+' · FAILED';  tl.appendChild(d); });
  s.skipped.forEach(t => { const d=document.createElement('div'); d.className='timeline-seg seg-skip'; d.title=t.title+' · SKIPPED'; tl.appendChild(d); });
});

// Suite cards
function ms(n){ return n >= 1000 ? (n/1000).toFixed(1)+'s' : n+'ms'; }

function buildSuites(filter) {
  const list = document.getElementById('suiteList');
  list.innerHTML = '';
  SUITES.forEach((suite, i) => {
    if (filter === 'pass' && suite.passed.length === 0) return;
    if (filter === 'fail' && suite.failed.length === 0) return;
    if (filter === 'skip' && suite.skipped.length === 0) return;

    const total = suite.passed.length + suite.failed.length + suite.skipped.length;
    const pct   = total > 0 ? Math.round((suite.passed.length / total) * 100) : 0;
    let pills = '';
    if (suite.passed.length)  pills += \`<span class="pill pill-pass">✓ \${suite.passed.length} passed</span>\`;
    if (suite.failed.length)  pills += \`<span class="pill pill-fail">✕ \${suite.failed.length} failed</span>\`;
    if (suite.skipped.length) pills += \`<span class="pill pill-skip">— \${suite.skipped.length} skipped</span>\`;

    let rows = '';
    suite.passed.forEach(t  => { rows += \`<div class="test-row pass-row"><div class="test-icon icon-pass">✓</div><div class="test-info"><div class="test-name">\${t.title}</div></div><div class="test-duration">\${ms(t.duration)}</div><span class="status-badge badge-pass">PASS</span></div>\`; });
    suite.failed.forEach(t  => { rows += \`<div class="test-row fail-row"><div class="test-icon icon-fail">✕</div><div class="test-info"><div class="test-name">\${t.title}</div>\${t.error ? \`<div class="test-error">\${t.error.slice(0,200)}\${t.error.length>200?'…':''}</div>\` : ''}</div><div class="test-duration">\${ms(t.duration)}</div><span class="status-badge badge-fail">FAIL</span></div>\`; });
    suite.skipped.forEach(t => { rows += \`<div class="test-row skip-row"><div class="test-icon icon-skip">—</div><div class="test-info"><div class="test-name">\${t.title}</div></div><div class="test-duration">—</div><span class="status-badge badge-skip">SKIP</span></div>\`; });

    const card = document.createElement('div');
    card.className = 'suite-card';
    card.style.animationDelay = (i * 0.03) + 's';
    card.innerHTML = \`
      <div class="suite-header" onclick="this.parentElement.classList.toggle('open')">
        <div><div class="suite-name">\${suite.name}</div><div style="font-family:DM Mono,monospace;font-size:11px;color:#475569;margin-top:3px;">\${suite.file}</div></div>
        <div style="display:flex;align-items:center;gap:16px;flex-shrink:0;">
          <div class="suite-pills">\${pills}</div>
          <div class="suite-progress"><div class="suite-progress-fill" style="width:\${pct}%"></div></div>
          <span class="chevron">▾</span>
        </div>
      </div>
      <div class="suite-body"><div class="test-list">\${rows}</div></div>\`;

    // Auto-open failed suites
    if (suite.failed.length > 0) card.classList.add('open');
    list.appendChild(card);
  });
}

function filterSuites(f, btn) {
  document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  buildSuites(f);
}

buildSuites('all');
</script>
</body>
</html>`;

// ─── Write output ─────────────────────────────────────────────────────────────
const outPath = path.join(__dirname, 'ASE_Test_Dashboard.html');
fs.writeFileSync(outPath, html, 'utf-8');
console.log(`✅  Dashboard generated → ${outPath}`);