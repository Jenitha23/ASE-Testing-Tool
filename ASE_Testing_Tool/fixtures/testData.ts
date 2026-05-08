export interface TestJob {
  title: string;
  location: string;
  type: string;
  category: string;
}

export const sampleJob: TestJob = {
  title: 'Frontend Developer Intern',
  location: 'Colombo',
  type: 'Internship',
  category: 'Software Engineering',
};

export const forgotPasswordUser = {
  email: 'forgot_test@testexample.com',
  password: 'OldPass@123',
  userType: 'STUDENT',
};