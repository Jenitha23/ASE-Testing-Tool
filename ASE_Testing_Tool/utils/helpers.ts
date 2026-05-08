import { Page, expect } from '@playwright/test';

export class TestHelpers {
  static generateUniqueEmail(prefix: string = 'test'): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}_${timestamp}_${random}@testexample.com`;
  }

  static generateStrongPassword(): string {
    return `Test@${Date.now()}123`;
  }

  static async waitForToast(page: Page, type: 'success' | 'error' = 'success') {
    const selector = type === 'success' ? '.alert.success' : '.alert.error';
    try {
      await page.waitForSelector(selector, { timeout: 10000 });
    } catch {
      // Some toasts might have different class names, try alternatives
      const altSelector = type === 'success' ? '[class*="success"]' : '[class*="error"]';
      await page.waitForSelector(altSelector, { timeout: 10000 });
    }
  }

  static async fillForm(page: Page, formData: Record<string, string>) {
    for (const [selector, value] of Object.entries(formData)) {
      await page.fill(selector, value);
    }
  }

  static async waitForNavigation(page: Page, urlPattern: RegExp) {
    await page.waitForURL(urlPattern, { timeout: 15000 });
  }
}

export const studentTestUser = {
  fullName: 'Test Student',
  email: TestHelpers.generateUniqueEmail('student'),
  password: TestHelpers.generateStrongPassword(),
};

export const studentProfileData = {
  headline: 'Full Stack Developer Intern',
  phone: '+94771234567',
  city: 'Colombo',
  country: 'Sri Lanka',
  address: '123 Main Street, Colombo 03',
  aboutMe: 'I am a passionate computer science student with experience in React and Node.js',
  education: 'BSc (Hons) Computer Science',
  university: 'University of Colombo',
  degree: 'Computer Science',
  academicYear: 'Year 3',
  gpa: '3.8',
  skills: 'JavaScript, React, Node.js, Python, SQL',
  technicalSkills: 'React, Node.js, Express, MongoDB, Git',
  softSkills: 'Communication, Teamwork, Problem Solving',
  languages: 'English, Sinhala',
  experience: 'Freelance web developer for 1 year',
  careerInterests: 'Full Stack Development, Cloud Computing',
  preferredJobType: 'Internship',
  workMode: 'Hybrid',
  githubUrl: 'https://github.com/teststudent',
  linkedinUrl: 'https://linkedin.com/in/teststudent',
  projectsSummary: 'Built an e-commerce website using MERN stack',
  internshipExperience: 'Completed internship at Tech Solutions',
  certifications: 'AWS Cloud Practitioner, Meta Frontend Developer',
};

// Use the provided email for forgot password test
export const forgotPasswordUser = {
  email: 'it23596566@my.sliit.lk',
  userType: 'STUDENT'
};