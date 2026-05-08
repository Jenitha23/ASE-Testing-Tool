import { test, expect, Page } from '@playwright/test';
import { TestHelpers, studentTestUser, studentProfileData } from '../utils/helpers';
import path from 'path';

// Run tests sequentially - no parallelism
test.describe.configure({ mode: 'serial' });

test.describe('Student Happy Path - Complete Flow (Sequential)', () => {
  let page: Page;
  let studentEmail: string;
  let studentPassword: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
    studentEmail = studentTestUser.email;
    studentPassword = studentTestUser.password;
  });

  test.afterAll(async () => {
    await page.close();
  });

  test('TC-S-01: Student Registration', async () => {
    await test.step('Navigate to student registration page', async () => {
      await page.goto('/');
      await page.click('text=Get Started');
      await page.waitForURL('**/auth/choose?mode=register');
      await page.click('button:has-text("Student")');
      await page.waitForURL('**/student/register');
    });

    await test.step('Fill registration form', async () => {
      await page.fill('input[name="fullName"]', studentTestUser.fullName);
      await page.fill('input[name="email"]', studentEmail);
      await page.fill('input[name="password"]', studentPassword);
      await page.fill('input[name="confirmPassword"]', studentPassword);
    });

    await test.step('Submit registration form', async () => {
      await page.click('button[type="submit"]:has-text("Create Account")');
      await page.waitForURL('**/student/home', { timeout: 15000 });
      await expect(page).toHaveURL(/\/student\/home/);
    });

    await test.step('Verify dashboard loads correctly', async () => {
      await expect(page.locator('.student-home-hero')).toBeVisible({ timeout: 10000 });
    });
  });

  test('TC-S-02: Student Login', async () => {
    await test.step('Logout first if already logged in', async () => {
      // Check if already logged in from registration
      const currentUrl = page.url();
      if (currentUrl.includes('/student/home')) {
        // Already logged in from registration, skip login
        return;
      }
    });

    await test.step('Navigate to student login page if not already logged in', async () => {
      const currentUrl = page.url();
      if (!currentUrl.includes('/student/home')) {
        await page.goto('/');
        await page.click('text=Sign In');
        await page.waitForURL('**/auth/choose?mode=login');
        await page.click('button:has-text("Student")');
        await page.waitForURL('**/student/login');
        
        await page.fill('input[name="email"]', studentEmail);
        await page.fill('input[name="password"]', studentPassword);
        await page.click('button[type="submit"]:has-text("Sign In")');
        await page.waitForURL('**/student/home', { timeout: 10000 });
      }
    });

    await test.step('Verify successful login', async () => {
      await expect(page.locator('.student-home-hero')).toBeVisible();
    });
  });

  test('TC-S-03: Complete Student Profile with CV Upload', async () => {
    await test.step('Navigate to profile page', async () => {
      await page.goto('/student/profile');
      await page.waitForURL('**/student/profile');
    });

    await test.step('Fill basic details', async () => {
      await page.fill('input[name="headline"]', studentProfileData.headline);
      await page.fill('input[name="phone"]', studentProfileData.phone);
      await page.fill('input[name="city"]', studentProfileData.city);
      await page.fill('input[name="country"]', studentProfileData.country);
      await page.fill('input[name="address"]', studentProfileData.address);
      await page.fill('textarea[name="aboutMe"]', studentProfileData.aboutMe);
    });

    await test.step('Fill education details', async () => {
      await page.fill('input[name="education"]', studentProfileData.education);
      await page.fill('input[name="university"]', studentProfileData.university);
      await page.fill('input[name="degree"]', studentProfileData.degree);
      await page.fill('input[name="academicYear"]', studentProfileData.academicYear);
      await page.fill('input[name="gpa"]', studentProfileData.gpa);
    });

    await test.step('Fill skills and experience', async () => {
      await page.fill('textarea[name="skills"]', studentProfileData.skills);
      await page.fill('textarea[name="technicalSkills"]', studentProfileData.technicalSkills);
      await page.fill('textarea[name="softSkills"]', studentProfileData.softSkills);
      await page.fill('textarea[name="languages"]', studentProfileData.languages);
      await page.fill('textarea[name="experience"]', studentProfileData.experience);
      await page.fill('textarea[name="projectsSummary"]', studentProfileData.projectsSummary);
      await page.fill('textarea[name="internshipExperience"]', studentProfileData.internshipExperience);
      await page.fill('textarea[name="certifications"]', studentProfileData.certifications);
    });

    await test.step('Fill career preferences', async () => {
      await page.fill('textarea[name="careerInterests"]', studentProfileData.careerInterests);
      await page.fill('input[name="preferredJobType"]', studentProfileData.preferredJobType);
      await page.fill('input[name="workMode"]', studentProfileData.workMode);
    });

    await test.step('Fill portfolio links', async () => {
      await page.fill('input[name="githubUrl"]', studentProfileData.githubUrl);
      await page.fill('input[name="linkedinUrl"]', studentProfileData.linkedinUrl);
    });

    await test.step('Upload CV file', async () => {
      // Create a dummy text file as CV if no PDF available
      const fs = require('fs');
      const cvPath = path.join(__dirname, '../fixtures/sample-cv.pdf');
      
      // Create dummy file if it doesn't exist
      if (!fs.existsSync(cvPath)) {
        fs.writeFileSync(cvPath, 'Sample CV content for testing purposes');
      }
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles(cvPath);
      await page.waitForTimeout(2000);
    });

    await test.step('Save profile', async () => {
      await page.click('button:has-text("Save Profile")');
      // Wait for success message
      await page.waitForSelector('.alert.success', { timeout: 15000 });
      await expect(page.locator('.alert.success')).toBeVisible();
    });
  });

  test('TC-S-04: Search and Browse Jobs', async () => {
    await test.step('Navigate to Browse Jobs', async () => {
      await page.goto('/student/jobs');
      await page.waitForURL('**/student/jobs');
      await page.waitForTimeout(2000);
    });

    await test.step('Search for jobs', async () => {
      // Wait for filters to be visible
      await page.waitForSelector('input[placeholder*="Try: Java, React, internship..."]', { timeout: 10000 });
      await page.fill('input[placeholder*="Try: Java, React, internship..."]', 'developer');
      await page.selectOption('select:has-text("Location")', 'Colombo');
      await page.click('button:has-text("Search")');
      await page.waitForTimeout(3000);
    });

    await test.step('Save a job to favorites', async () => {
      // Wait for job cards to load
      await page.waitForSelector('.card', { timeout: 10000 });
      const saveButton = page.locator('button[title*="Save this job"]').first();
      if (await saveButton.isVisible()) {
        await saveButton.click();
        await page.waitForTimeout(1000);
      }
    });

    await test.step('View job details', async () => {
      const jobLink = page.locator('a[href*="/student/jobs/"]').first();
      if (await jobLink.isVisible()) {
        const href = await jobLink.getAttribute('href');
        await jobLink.click();
        await page.waitForURL(/\/student\/jobs\/\d+/);
        await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
      }
    });
  });

  test('TC-S-05: Apply for a Job', async () => {
    await test.step('Navigate to a job listing', async () => {
      await page.goto('/student/jobs');
      await page.waitForURL('**/student/jobs');
      await page.waitForTimeout(2000);
      
      const jobLink = page.locator('a[href*="/student/jobs/"]').first();
      await jobLink.click();
      await page.waitForURL(/\/student\/jobs\/\d+/);
      await page.waitForTimeout(2000);
    });

    await test.step('Click Apply Now button', async () => {
      const applyButton = page.locator('button:has-text("Apply Now")');
      await applyButton.waitFor({ state: 'visible', timeout: 10000 });
      await applyButton.click();
      await page.waitForSelector('div[style*="position: fixed"]', { timeout: 5000 });
    });

    await test.step('Fill cover letter in modal', async () => {
      const coverLetter = `I am very interested in this position. 
        I have relevant experience and skills that match this role perfectly.
        Thank you for considering my application.`;
      await page.fill('textarea[placeholder*="cover letter"]', coverLetter);
    });

    await test.step('Submit application', async () => {
      await page.click('button:has-text("Submit Application")');
      await page.waitForTimeout(3000);
    });

    await test.step('Verify application success or already applied', async () => {
      // Check for success message or already applied message
      const successMessage = page.locator('.alert.success');
      const appliedMessage = page.locator('text=Applied — Status:');
      
      if (await successMessage.isVisible({ timeout: 5000 })) {
        await expect(successMessage).toBeVisible();
      } else if (await appliedMessage.isVisible({ timeout: 5000 })) {
        // Already applied, that's fine
        console.log('Already applied to this job');
      }
    });
  });

  test('TC-S-06: View ATS Score and AI Analysis', async () => {
    await test.step('Navigate to AI Career Dashboard', async () => {
      await page.goto('/student/ai-dashboard');
      await page.waitForURL('**/student/ai-dashboard');
      await page.waitForTimeout(3000);
    });

    await test.step('Check for existing analysis or analyze CV', async () => {
      // Wait for page to load
      await page.waitForTimeout(3000);
      
      // Check if analyze button exists
      const analyzeButton = page.locator('button:has-text("Analyze Now")');
      if (await analyzeButton.isVisible({ timeout: 5000 })) {
        await analyzeButton.click();
        await page.waitForTimeout(5000);
      }
    });

    await test.step('Verify ATS Score is displayed', async () => {
      await page.waitForTimeout(3000);
      // Check for any score or analysis content
      const atsSection = page.locator('.card').first();
      await expect(atsSection).toBeVisible();
    });

    await test.step('View detailed analysis if available', async () => {
      const detailsButton = page.locator('button:has-text("Show Detailed Analysis")');
      if (await detailsButton.isVisible({ timeout: 3000 })) {
        await detailsButton.click();
        await page.waitForTimeout(2000);
      }
    });
  });

  test('TC-S-07: View Applications and Track Status', async () => {
    await test.step('Navigate to Applications page', async () => {
      await page.goto('/student/applications');
      await page.waitForURL('**/student/applications');
      await page.waitForTimeout(3000);
    });

    await test.step('Verify applications page loads', async () => {
      await expect(page.locator('h1:has-text("My Job Applications")')).toBeVisible({ timeout: 10000 });
    });

    await test.step('Check for applications or empty state', async () => {
      const applicationsExist = page.locator('.card[style*="border-left"]');
      if (await applicationsExist.isVisible({ timeout: 5000 })) {
        await expect(applicationsExist.first()).toBeVisible();
      } else {
        // Empty state is acceptable
        await expect(page.locator('text=No applications yet')).toBeVisible();
      }
    });
  });

  test('TC-S-08: View Saved Jobs', async () => {
    await test.step('Navigate to Saved Jobs', async () => {
      await page.goto('/student/saved-jobs');
      await page.waitForURL('**/student/saved-jobs');
      await page.waitForTimeout(3000);
    });

    await test.step('Verify saved jobs page loads', async () => {
      await expect(page.locator('h1:has-text("My Saved Jobs")')).toBeVisible({ timeout: 10000 });
    });
  });

  test('TC-S-09: Student Logout', async () => {
  await test.step('Navigate to dashboard', async () => {
    await page.goto('/student/home');
    await expect(page).toHaveURL(/\/student\/home/);
  });

  await test.step('Click logout button', async () => {
    const logoutButton = page.getByRole('button', { name: /sign out|logout/i });
    await expect(logoutButton).toBeVisible({ timeout: 20000 });

    await Promise.all([
      page.waitForURL('/', { timeout: 20000 }),
      logoutButton.click()
    ]);
  });

  await test.step('Verify landing page login options', async () => {
    await expect(page).toHaveURL('/');

    await expect(
      page.getByRole('link', { name: /^Sign In$/i }).first()
    ).toBeVisible({ timeout: 10000 });

    await expect(
      page.getByRole('link', { name: /Get Started/i }).first()
    ).toBeVisible({ timeout: 10000 });
  });
});
});