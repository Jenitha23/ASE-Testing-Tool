import { test, expect, Page } from '@playwright/test';

// Test data
const adminUser = {
  email: 'admin@pathfinder.com',  
  password: 'Admin@123'            
};

// Company data for admin actions
const pendingCompany = {
  companyName: 'Pending Test Company',
  email: `pending_${Date.now()}@testcompany.com`,
  password: 'Test@123456'
};

test.describe.configure({ mode: 'serial' });

test.describe('Admin Happy Path - Complete Flow', () => {
  let page: Page;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('TC-A-01: Admin Login', async () => {
    await test.step('Navigate to admin login page', async () => {
      await page.goto('/admin/login');
      await page.waitForURL('**/admin/login');
    });

    await test.step('Fill admin credentials', async () => {
      await page.fill('input[name="email"]', adminUser.email);
      await page.fill('input[name="password"]', adminUser.password);
    });

    await test.step('Submit login', async () => {
      await page.click('button[type="submit"]:has-text("Sign In")');
      await page.waitForURL('**/admin/dashboard', { timeout: 15000 });
    });

    await test.step('Verify admin dashboard loads', async () => {
      await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
      // Fix: Use .first() to handle multiple .admin-kpi-grid elements
      await expect(page.locator('.admin-kpi-grid').first()).toBeVisible();
    });
  });

  test('TC-A-02: View Dashboard Analytics', async () => {
    await test.step('Verify stats cards are visible', async () => {
      await expect(page.locator('text=Total Students')).toBeVisible();
      await expect(page.locator('text=Total Companies')).toBeVisible();
      await expect(page.locator('text=Total Jobs')).toBeVisible();
      await expect(page.locator('text=Total Applications')).toBeVisible();
    });

    await test.step('Verify charts are loaded', async () => {
      await expect(page.locator('canvas').first()).toBeVisible({ timeout: 10000 });
    });

    await test.step('Test date range filter', async () => {
      const datePicker = page.locator('select:has-text("Last 30 Days")');
      if (await datePicker.isVisible()) {
        await datePicker.selectOption('last7days');
        await page.waitForTimeout(2000);
      }
    });
  });

  test('TC-A-03: View Students List', async () => {
    await test.step('Navigate to Students page', async () => {
      await page.click('a:has-text("Students")');
      await page.waitForURL('**/admin/students');
      await page.waitForTimeout(2000);
    });

    await test.step('Verify students table loads', async () => {
      await expect(page.locator('.admin-table')).toBeVisible();
      await expect(page.locator('th:has-text("Full Name")')).toBeVisible();
      await expect(page.locator('th:has-text("Email")')).toBeVisible();
    });

    await test.step('Search for a student', async () => {
      const searchInput = page.locator('input[placeholder*="Search by name or email"]');
      await searchInput.fill('test');
      await page.waitForTimeout(1000);
    });

    await test.step('Clear search', async () => {
      await page.click('button:has-text("Reset")');
      await page.waitForTimeout(1000);
    });
  });

  test('TC-A-04: Edit Student Account', async () => {
    await test.step('Navigate to Students page', async () => {
      await page.goto('/admin/students');
      await page.waitForURL('**/admin/students');
    });

    await test.step('Click edit button on first student', async () => {
      const editButton = page.locator('button:has-text("Edit")').first();
      await editButton.waitFor({ state: 'visible', timeout: 10000 });
      await editButton.click();
      await page.waitForTimeout(1000);
    });

    await test.step('Verify edit modal opens', async () => {
      await expect(page.locator('h3:has-text("Edit Student")')).toBeVisible();
    });

    await test.step('Close modal', async () => {
      await page.click('button:has-text("Cancel")');
    });
  });

  test('TC-A-05: View Companies List', async () => {
    await test.step('Navigate to Companies page', async () => {
      await page.goto('/admin/companies');
      await page.waitForURL('**/admin/companies');
      await page.waitForTimeout(2000);
    });

    await test.step('Verify companies table loads', async () => {
      await expect(page.locator('.admin-table')).toBeVisible();
      await expect(page.locator('th:has-text("Company Name")')).toBeVisible();
    });

    await test.step('Filter by status', async () => {
      const statusFilter = page.locator('select:has-text("All Status")');
      await statusFilter.selectOption('PENDING_APPROVAL');
      await page.waitForTimeout(2000);
    });

    await test.step('Reset filters', async () => {
      await page.click('button:has-text("Reset")');
      await page.waitForTimeout(1000);
    });
  });

  test('TC-A-06: View Jobs Per Month Report', async () => {
    await test.step('Navigate to Jobs Per Month Report', async () => {
      await page.goto('/admin/reports/jobs-per-month');
      await page.waitForURL('**/admin/reports/jobs-per-month');
      await page.waitForTimeout(2000);
    });

    await test.step('Verify report loads', async () => {
      await expect(page.locator('h1:has-text("Jobs Per Month Report")')).toBeVisible();
      await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    });

    await test.step('Test date filter', async () => {
      const yearSelect = page.locator('select:has-text("Select Year")');
      if (await yearSelect.isVisible()) {
        await yearSelect.selectOption(new Date().getFullYear().toString());
        await page.click('button:has-text("Apply")');
        await page.waitForTimeout(2000);
      }
    });
  });

  test('TC-A-07: View Applications Per Job Report', async () => {
    await test.step('Navigate to Applications Per Job Report', async () => {
      await page.goto('/admin/reports/applications-per-job');
      await page.waitForURL('**/admin/reports/applications-per-job');
      await page.waitForTimeout(2000);
    });

    await test.step('Verify report loads', async () => {
      await expect(page.locator('h1:has-text("Applications Per Job Report")')).toBeVisible();
      await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
    });
  });

test('TC-A-08: View AI Insights Dashboard', async () => {
  await test.step('Navigate to AI Insights', async () => {
    await page.goto('/admin/ai-insights');
    await page.waitForURL('**/admin/ai-insights');
  });

  await test.step('Wait for AI insights to auto-load', async () => {
    // ✅ Wait until actual AI section appears (NOT timeout)
    await expect(
      page.getByText('Talent Demand Insights')
    ).toBeVisible({ timeout: 40000 });
  });

  await test.step('Verify AI dashboard content', async () => {
    await expect(page.getByRole('heading', { name: 'AI Analytics' })).toBeVisible();

    await expect(
      page.getByText('AI-powered admin insights retrieved successfully')
    ).toBeVisible();

    await expect(
      page.getByRole('heading', { name: /Platform Health/i })
    ).toBeVisible();
  });
});

  test('TC-A-09: View Admin Profile', async () => {
    await test.step('Navigate to Admin Profile', async () => {
      await page.goto('/admin/profile');
      await page.waitForURL('**/admin/profile');
      await page.waitForTimeout(2000);
    });

    await test.step('Verify profile form loads', async () => {
      await expect(page.locator('h3:has-text("Update Profile")')).toBeVisible();
      await expect(page.locator('h3:has-text("Change Password")')).toBeVisible();
    });

    await test.step('Update profile information', async () => {
      const fullNameInput = page.locator('#fullName');
      const currentName = await fullNameInput.inputValue();
      await fullNameInput.fill(`${currentName} (Updated)`);
      await page.click('button:has-text("Save Profile")');
      await page.waitForTimeout(2000);
    });

    await test.step('Verify update success', async () => {
      const successMessage = page.locator('.alert.success');
      await expect(successMessage).toBeVisible({ timeout: 10000 });
    });
  });

  test('TC-A-10: Admin Logout', async () => {
  await test.step('Click logout button', async () => {
    // Use .first() to handle multiple logout buttons
    const logoutButton = page.locator('button:has-text("Logout")').first();
    await logoutButton.waitFor({ state: 'visible', timeout: 10000 });
    await logoutButton.click();
    // After logout, user is redirected to landing page
    await page.waitForURL('/', { timeout: 10000 });
  });

  await test.step('Verify logout successful', async () => {
    await expect(page).toHaveURL('/');
    // Fix: Use .first() to handle multiple "Sign In" elements
    await expect(page.locator('text=Sign In').first()).toBeVisible();
    await expect(page.locator('text=Get Started').first()).toBeVisible();
  });
});
});

// Separate test for company approval workflow (requires a pending company)
test.describe('Admin Company Approval Workflow', () => {
  let page: Page;
  let pendingCompanyEmail: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    pendingCompanyEmail = pendingCompany.email;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('TC-A-11: Create Pending Company Registration', async () => {
    await test.step('Register a new company', async () => {
      await page.goto('/company/register');
      await page.fill('input[name="companyName"]', pendingCompany.companyName);
      await page.fill('input[name="email"]', pendingCompanyEmail);
      await page.fill('input[name="password"]', pendingCompany.password);
      await page.fill('input[name="confirmPassword"]', pendingCompany.password);
      await page.click('button[type="submit"]:has-text("Register Company")');
      await page.waitForTimeout(3000);
    });

    await test.step('Verify registration pending message', async () => {
      const successMessage = page.locator('.alert.success');
      await expect(successMessage).toBeVisible();
      await expect(successMessage).toContainText('registered successfully');
    });
  });

  test('TC-A-12: Admin Approves Company', async () => {
  await test.step('Login as admin', async () => {
    await page.goto('/admin/login');
    await page.fill('input[name="email"]', adminUser.email);
    await page.fill('input[name="password"]', adminUser.password);
    await page.click('button[type="submit"]:has-text("Sign In")');
    await page.waitForURL('**/admin/dashboard');
  });

  await test.step('Navigate to Companies', async () => {
    await page.goto('/admin/companies');
    await page.waitForURL('**/admin/companies');
  });

  await test.step('Filter pending companies', async () => {
    const statusFilter = page.locator('select:has-text("All Status")');
    await statusFilter.selectOption('PENDING_APPROVAL');
  });

  await test.step('Find and approve the pending company', async () => {
    // ✅ Use UNIQUE email instead of company name
    const companyRow = page
      .getByRole('row')
      .filter({ hasText: pendingCompanyEmail });

    await expect(companyRow).toBeVisible({ timeout: 10000 });

    // ✅ Click approve inside that specific row
    await companyRow.getByRole('button', { name: 'Approve' }).click();
  });

  await test.step('Verify approval success', async () => {
    const successMessage = page.locator('.alert.success');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    await expect(successMessage).toContainText('approved successfully');
  });
});
});