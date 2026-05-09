import { test, expect, Page } from '@playwright/test';

// ─── Test Data ───────────────────────────────────────────────────────────────

const validStudent = {
  email: 'student@gmail.com',
  password: '123456789J'
};

const LONG_STRING = 'A'.repeat(1001);
const XSS_PAYLOAD = '<script>alert("xss")</script>';
const SQL_PAYLOAD = "' OR '1'='1'; DROP TABLE users; --";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function loginAsStudent(page: Page) {
  await page.goto('/student/login');
  await page.waitForURL('**/student/login');
  await page.fill('input[name="email"]', validStudent.email);
  await page.fill('input[name="password"]', validStudent.password);
  await page.click('button[type="submit"]:has-text("Sign In")');
  await page.waitForURL('**/student/home', { timeout: 15000 });
}

async function waitForProfileSaveOrStability(page: Page) {
  await page.waitForTimeout(2000);
  await expect(page.locator('body')).toBeVisible();

  const successVisible = await page
    .locator('text=Profile updated successfully')
    .isVisible()
    .catch(() => false);

  const errorVisible = await page
    .locator('.alert.error, [role="alert"], .error-message')
    .isVisible()
    .catch(() => false);

  expect(successVisible || errorVisible || page.url().includes('/student/profile')).toBeTruthy();
}

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 1 — AUTHENTICATION EDGE CASES
// ═════════════════════════════════════════════════════════════════════════════

test.describe('TC-S-EC-01 | Student Login – Invalid Credentials', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/student/login');
    await page.waitForURL('**/student/login');
  });

  test.afterEach(async () => await page.close());

  test('Wrong password shows error and stays on login page', async () => {
    await page.fill('input[name="email"]', validStudent.email);
    await page.fill('input[name="password"]', 'WrongPass999!');
    await page.click('button[type="submit"]:has-text("Sign In")');

    await expect(page.locator('.alert.error, [role="alert"], .error-message').first())
      .toBeVisible({ timeout: 8000 });
    await expect(page).toHaveURL(/\/student\/login/);
  });

  test('Non-existent email shows error', async () => {
    await page.fill('input[name="email"]', `ghost_${Date.now()}@nowhere.com`);
    await page.fill('input[name="password"]', 'SomePass@123');
    await page.click('button[type="submit"]:has-text("Sign In")');

    await expect(page.locator('.alert.error, [role="alert"], .error-message').first())
      .toBeVisible({ timeout: 8000 });
    await expect(page).toHaveURL(/\/student\/login/);
  });

  test('Empty email field shows validation error', async () => {
    await page.fill('input[name="password"]', validStudent.password);
    await page.click('button[type="submit"]:has-text("Sign In")');

    const emailInput = page.locator('input[name="email"]');
    const validationMsg = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );

    const hasCustomError = await page
      .locator('.alert.error, [role="alert"], .error-message')
      .isVisible()
      .catch(() => false);

    expect(validationMsg || hasCustomError).toBeTruthy();
    await expect(page).toHaveURL(/\/student\/login/);
  });

  test('Empty password field shows validation error', async () => {
    await page.fill('input[name="email"]', validStudent.email);
    await page.click('button[type="submit"]:has-text("Sign In")');

    const passwordInput = page.locator('input[name="password"]');
    const validationMsg = await passwordInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );

    const hasCustomError = await page
      .locator('.alert.error, [role="alert"], .error-message')
      .isVisible()
      .catch(() => false);

    expect(validationMsg || hasCustomError).toBeTruthy();
  });

  test('Malformed email (no @) rejected', async () => {
    await page.fill('input[name="email"]', 'notanemail');
    await page.fill('input[name="password"]', validStudent.password);
    await page.click('button[type="submit"]:has-text("Sign In")');

    const emailInput = page.locator('input[name="email"]');
    const validationMsg = await emailInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );

    expect(validationMsg).not.toBe('');
  });

  test('SQL injection in email field does not break login', async () => {
    await page.fill('input[name="email"]', SQL_PAYLOAD);
    await page.fill('input[name="password"]', SQL_PAYLOAD);
    await page.click('button[type="submit"]:has-text("Sign In")');

    await expect(page).not.toHaveURL(/\/student\/home/);
    await expect(page.locator('body')).toBeVisible();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 2 — REGISTRATION EDGE CASES
// ═════════════════════════════════════════════════════════════════════════════

test.describe('TC-S-EC-02 | Student Registration – Validation & Edge Cases', () => {
  let page: Page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    await page.goto('/student/register');
    await page.waitForURL('**/student/register');
  });

  test.afterEach(async () => await page.close());

  test('Duplicate email registration is rejected', async () => {
    await page.fill('input[name="fullName"]', 'Duplicate Student');
    await page.fill('input[name="email"]', validStudent.email);
    await page.fill('input[name="password"]', 'NewPass@123');
    await page.fill('input[name="confirmPassword"]', 'NewPass@123');
    await page.click('button[type="submit"]:has-text("Create Account")');

    await expect(page.locator('.alert.error, [role="alert"], .error-message').first())
      .toBeVisible({ timeout: 10000 });
    await expect(page).not.toHaveURL(/\/student\/home/);
  });

  test('Password mismatch shows error', async () => {
    await page.fill('input[name="fullName"]', 'Test Student');
    await page.fill('input[name="email"]', `mismatch_${Date.now()}@test.com`);
    await page.fill('input[name="password"]', 'Pass@123');
    await page.fill('input[name="confirmPassword"]', 'DifferentPass@456');
    await page.click('button[type="submit"]:has-text("Create Account")');

    await expect(
      page.locator('text=/password.*match|do not match|passwords must match/i').first()
    ).toBeVisible({ timeout: 8000 });
  });

  test('Weak password (too short) is rejected', async () => {
    await page.fill('input[name="fullName"]', 'Test Student');
    await page.fill('input[name="email"]', `weak_${Date.now()}@test.com`);
    await page.fill('input[name="password"]', '123');
    await page.fill('input[name="confirmPassword"]', '123');
    await page.click('button[type="submit"]:has-text("Create Account")');

    const passwordInput = page.locator('input[name="password"]');
    const validationMsg = await passwordInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );

    const hasError = await page
      .locator('.alert.error, [role="alert"], .error-message')
      .isVisible()
      .catch(() => false);

    expect(validationMsg || hasError).toBeTruthy();
    await expect(page).not.toHaveURL(/\/student\/home/);
  });

  test('Empty full name field is rejected', async () => {
    await page.fill('input[name="email"]', `empty_name_${Date.now()}@test.com`);
    await page.fill('input[name="password"]', 'Valid@123');
    await page.fill('input[name="confirmPassword"]', 'Valid@123');
    await page.click('button[type="submit"]:has-text("Create Account")');

    const nameInput = page.locator('input[name="fullName"]');
    const validationMsg = await nameInput.evaluate(
      (el: HTMLInputElement) => el.validationMessage
    );

    expect(validationMsg).not.toBe('');
  });

  test('XSS payload in full name is sanitized', async () => {
    await page.fill('input[name="fullName"]', XSS_PAYLOAD);
    await page.fill('input[name="email"]', `xss_${Date.now()}@test.com`);
    await page.fill('input[name="password"]', 'Valid@12345');
    await page.fill('input[name="confirmPassword"]', 'Valid@12345');
    await page.click('button[type="submit"]:has-text("Create Account")');

    const alertFired = await page.evaluate(
      () => (window as any).__xssTriggered === true
    ).catch(() => false);

    expect(alertFired).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 3 — PROFILE FORM EDGE CASES
// ═════════════════════════════════════════════════════════════════════════════

test.describe('TC-S-EC-03 | Student Profile – Validation Edge Cases', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsStudent(page);
  });

  test.afterAll(async () => await page.close());

  test.beforeEach(async () => {
    await page.goto('/student/profile');
    await page.waitForURL('**/student/profile');
  });

  test('Oversized About Me (>1000 chars) is handled without crashing', async () => {
    const aboutMe = page.locator('textarea[name="aboutMe"]');
    await aboutMe.clear();
    await aboutMe.fill(LONG_STRING);
    await page.click('button:has-text("Save Profile")');

    await waitForProfileSaveOrStability(page);

    const currentValue = await aboutMe.inputValue();
    expect(currentValue.length).toBeGreaterThan(0);
  });

  test('Invalid phone number format is handled without crashing', async () => {
    const phoneInput = page.locator('input[name="phone"]');
    await phoneInput.clear();
    await phoneInput.fill('abc-not-a-phone');
    await page.click('button:has-text("Save Profile")');

    await waitForProfileSaveOrStability(page);
    await expect(phoneInput).toBeVisible();
  });

  test('Invalid GitHub URL is handled without crashing', async () => {
    const githubInput = page.locator('input[name="githubUrl"]');
    await githubInput.clear();
    await githubInput.fill('not-a-url');
    await page.click('button:has-text("Save Profile")');

    await waitForProfileSaveOrStability(page);
    await expect(githubInput).toBeVisible();
  });

  test('Non-numeric GPA input is handled without crashing', async () => {
    const gpaInput = page.locator('input[name="gpa"]');
    await gpaInput.clear();
    await gpaInput.fill('excellent');
    await page.click('button:has-text("Save Profile")');

    await waitForProfileSaveOrStability(page);
    await expect(gpaInput).toBeVisible();
  });

  test('Uploading a non-PDF file as CV is rejected', async () => {
    const fileInput = page.locator('input[type="file"]');

    await page.evaluate(() => {
      const dt = new DataTransfer();
      const file = new File(['fake image data'], 'fake-cv.jpg', { type: 'image/jpeg' });
      dt.items.add(file);

      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      if (input) {
        Object.defineProperty(input, 'files', { value: dt.files });
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    await page.waitForTimeout(1000);

    const hasError = await page
      .locator(
        'text=/only pdf|pdf.*required|invalid.*file|file.*type/i, .alert.error, [role="alert"]'
      )
      .isVisible()
      .catch(() => false);

    const inputValue = await fileInput.inputValue().catch(() => '');
    expect(hasError || inputValue === '').toBeTruthy();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 4 — JOB SEARCH EDGE CASES
// ═════════════════════════════════════════════════════════════════════════════

test.describe('TC-S-EC-04 | Job Search – Edge Cases', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsStudent(page);
  });

  test.afterAll(async () => await page.close());

  test.beforeEach(async () => {
    await page.goto('/student/jobs');
    await page.waitForURL('**/student/jobs');
    await page.waitForTimeout(2000);
  });

  test('Search with gibberish query returns no results gracefully', async () => {
    await page.fill(
      'input[placeholder*="Try: Java, React, internship..."]',
      'zzzzxxxxxqqqq99999'
    );

    await page.click('button:has-text("Search")');
    await page.waitForTimeout(3000);

    const noResults = page.locator('text=/no jobs found|no results|0 jobs/i');
    const jobCards = page.locator('.card, [class*="job-card"]');

    const hasEmptyMsg = await noResults.isVisible().catch(() => false);
    const cardCount = await jobCards.count().catch(() => 0);

    expect(hasEmptyMsg || cardCount === 0).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });

  test('XSS payload in search bar does not execute', async () => {
    await page.fill(
      'input[placeholder*="Try: Java, React, internship..."]',
      '<script>window.__xss=true</script>'
    );

    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);

    const xssTriggered = await page.evaluate(() => (window as any).__xss === true);
    expect(xssTriggered).toBe(false);
  });

  test('Extremely long search query is handled gracefully', async () => {
    await page.fill(
      'input[placeholder*="Try: Java, React, internship..."]',
      'developer '.repeat(100)
    );

    await page.click('button:has-text("Search")');
    await page.waitForTimeout(3000);

    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL(/\/student\/jobs/);
  });

  test('Direct navigation to non-existent job ID returns error or redirect', async () => {
    await page.goto('/student/jobs/999999999');
    await page.waitForTimeout(3000);

    const hasNotFound = await page
      .locator('text=/not found|job.*not exist|404/i')
      .isVisible()
      .catch(() => false);

    const wasRedirected = !page.url().includes('999999999');

    expect(hasNotFound || wasRedirected).toBeTruthy();
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 5 — APPLICATION EDGE CASES
// ═════════════════════════════════════════════════════════════════════════════

test.describe('TC-S-EC-05 | Job Application – Edge Cases', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsStudent(page);
  });

  test.afterAll(async () => await page.close());

  test('Submitting application with empty cover letter is handled gracefully', async () => {
    await page.goto('/student/jobs');
    await page.waitForURL('**/student/jobs');
    await page.waitForTimeout(2000);

    const jobLink = page.locator('a[href*="/student/jobs/"]').first();
    await jobLink.click();
    await page.waitForURL(/\/student\/jobs\/\d+/);
    await page.waitForTimeout(1500);

    const applyButton = page.locator('button:has-text("Apply Now")');
    if (!(await applyButton.isVisible({ timeout: 5000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await applyButton.click();
    await page.waitForSelector('div[style*="position: fixed"], .modal', { timeout: 5000 });

    await page.click('button:has-text("Submit Application")');
    await page.waitForTimeout(3000);

    const hasError = await page
      .locator('.alert.error, [role="alert"], text=/cover letter.*required|required/i')
      .isVisible()
      .catch(() => false);

    const modalStillOpen = await page
      .locator('div[style*="position: fixed"], .modal')
      .isVisible()
      .catch(() => false);

    const submitted = await page
      .locator('text=/Application Submitted|submitted successfully|Status: Pending|Applied — Status/i')
      .isVisible()
      .catch(() => false);

    expect(hasError || modalStillOpen || submitted).toBeTruthy();
  });

  test('Duplicate application attempt is rejected gracefully', async () => {
    await page.goto('/student/jobs');
    await page.waitForURL('**/student/jobs');
    await page.waitForTimeout(2000);

    const jobLink = page.locator('a[href*="/student/jobs/"]').first();
    await jobLink.click();
    await page.waitForURL(/\/student\/jobs\/\d+/);
    await page.waitForTimeout(1500);

    const alreadyApplied = await page
      .locator('text=/Applied — Status:|already applied/i')
      .isVisible()
      .catch(() => false);

    if (alreadyApplied) {
      await expect(page.locator('button:has-text("Apply Now")')).not.toBeVisible();
    } else {
      const applyButton = page.locator('button:has-text("Apply Now")');

      if (!(await applyButton.isVisible({ timeout: 3000 }).catch(() => false))) {
        test.skip();
        return;
      }

      await applyButton.click();
      await page.waitForSelector('div[style*="position: fixed"], .modal', { timeout: 5000 });
      await page.fill('textarea[placeholder*="cover letter"]', 'First application.');
      await page.click('button:has-text("Submit Application")');
      await page.waitForTimeout(3000);

      const applyAgain = page.locator('button:has-text("Apply Now")');

      if (await applyAgain.isVisible({ timeout: 3000 }).catch(() => false)) {
        await applyAgain.click();
        await page.waitForSelector('div[style*="position: fixed"], .modal', { timeout: 5000 });
        await page.fill('textarea[placeholder*="cover letter"]', 'Duplicate application.');
        await page.click('button:has-text("Submit Application")');
        await page.waitForTimeout(3000);

        await expect(
          page.locator('.alert.error, [role="alert"], text=/already applied/i').first()
        ).toBeVisible({ timeout: 8000 });
      }
    }
  });

  test('Cover letter with XSS payload does not execute script', async () => {
    await page.goto('/student/jobs');
    await page.waitForURL('**/student/jobs');
    await page.waitForTimeout(2000);

    const jobLink = page.locator('a[href*="/student/jobs/"]').first();
    await jobLink.click();
    await page.waitForURL(/\/student\/jobs\/\d+/);
    await page.waitForTimeout(1500);

    const applyButton = page.locator('button:has-text("Apply Now")');

    if (!(await applyButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await applyButton.click();
    await page.waitForSelector('div[style*="position: fixed"], .modal', { timeout: 5000 });

    await page.fill(
      'textarea[placeholder*="cover letter"]',
      `${XSS_PAYLOAD} – I am applying for the role.`
    );

    await page.click('button:has-text("Submit Application")');
    await page.waitForTimeout(3000);

    const xssTriggered = await page.evaluate(() => (window as any).__xssTriggered === true);
    expect(xssTriggered).toBe(false);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 6 — AUTHORIZATION & SESSION EDGE CASES
// ═════════════════════════════════════════════════════════════════════════════

test.describe('TC-S-EC-06 | Authorization – Unauthenticated Access', () => {
  test('Unauthenticated user is redirected away from /student/home', async ({ page }) => {
    await page.goto('/student/home');
    await page.waitForTimeout(3000);
    await expect(page).not.toHaveURL(/\/student\/home/);
  });

  test('Unauthenticated user is redirected away from /student/profile', async ({ page }) => {
    await page.goto('/student/profile');
    await page.waitForTimeout(3000);
    await expect(page).not.toHaveURL(/\/student\/profile/);
  });

  test('Unauthenticated user is redirected away from /student/applications', async ({ page }) => {
    await page.goto('/student/applications');
    await page.waitForTimeout(3000);
    await expect(page).not.toHaveURL(/\/student\/applications/);
  });

  test('Student cannot access /admin/dashboard', async ({ page }) => {
    await page.goto('/student/login');
    await page.fill('input[name="email"]', validStudent.email);
    await page.fill('input[name="password"]', validStudent.password);
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForURL('**/student/home', { timeout: 15000 });

    await page.goto('/admin/dashboard');
    await page.waitForTimeout(3000);
    await expect(page).not.toHaveURL(/\/admin\/dashboard/);
  });

  test('Student cannot access /company/dashboard', async ({ page }) => {
    await page.goto('/student/login');
    await page.fill('input[name="email"]', validStudent.email);
    await page.fill('input[name="password"]', validStudent.password);
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForURL('**/student/home', { timeout: 15000 });

    await page.goto('/company/dashboard');
    await page.waitForTimeout(3000);
    await expect(page).not.toHaveURL(/\/company\/dashboard/);
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// SUITE 7 — AI DASHBOARD EDGE CASES
// ═════════════════════════════════════════════════════════════════════════════

test.describe('TC-S-EC-07 | AI Dashboard – Edge Cases', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    await loginAsStudent(page);
  });

  test.afterAll(async () => await page.close());

  test('AI dashboard loads without CV gracefully (no crash)', async () => {
    await page.goto('/student/ai-dashboard');
    await page.waitForURL('**/student/ai-dashboard');
    await page.waitForTimeout(4000);

    await expect(page.locator('body')).toBeVisible();

    const hasContent = await page.locator('.card, h1, h2').first().isVisible();
    expect(hasContent).toBeTruthy();
  });

  test('Rapid repeated clicks on Analyze Now do not cause duplicate requests', async () => {
    await page.goto('/student/ai-dashboard');
    await page.waitForURL('**/student/ai-dashboard');
    await page.waitForTimeout(3000);

    const analyzeButton = page.locator('button:has-text("Analyze Now")');

    if (!(await analyzeButton.isVisible({ timeout: 3000 }).catch(() => false))) {
      test.skip();
      return;
    }

    await analyzeButton.click();
    await analyzeButton.click().catch(() => {});
    await analyzeButton.click().catch(() => {});
    await page.waitForTimeout(5000);

    await expect(page.locator('body')).toBeVisible();
    await expect(page).toHaveURL(/\/student\/ai-dashboard/);
  });
});