import * as z from 'zod';

// Common validation patterns
export const validationPatterns = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  password: {
    minLength: 8,
    hasUpperCase: /[A-Z]/,
    hasLowerCase: /[a-z]/,
    hasNumber: /\d/,
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/
  },
  phone: /^\+?[\d\s\-\(\)]{10,15}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  name: /^[a-zA-Z\s'-]{2,50}$/
};

// Common validation schemas
export const commonSchemas = {
  email: () => z.string()
    .min(1, { message: 'Email is required' })
    .regex(validationPatterns.email, { message: 'Please enter a valid email address' })
    .max(255, { message: 'Email must not exceed 255 characters' }),

  password: () => z.string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .regex(validationPatterns.password.hasUpperCase, { message: 'Password must contain at least one uppercase letter' })
    .regex(validationPatterns.password.hasLowerCase, { message: 'Password must contain at least one lowercase letter' })
    .regex(validationPatterns.password.hasNumber, { message: 'Password must contain at least one number' })
    .regex(validationPatterns.password.hasSpecialChar, { message: 'Password must contain at least one special character' })
    .max(128, { message: 'Password must not exceed 128 characters' }),

  firstName: () => z.string()
    .min(2, { message: 'First name must be at least 2 characters long' })
    .max(50, { message: 'First name must not exceed 50 characters' })
    .regex(validationPatterns.name, { message: 'First name contains invalid characters' }),

  lastName: () => z.string()
    .min(2, { message: 'Last name must be at least 2 characters long' })
    .max(50, { message: 'Last name must not exceed 50 characters' })
    .regex(validationPatterns.name, { message: 'Last name contains invalid characters' }),

  title: (min = 2, max = 100) => z.string()
    .min(min, { message: `Title must be at least ${min} characters long` })
    .max(max, { message: `Title must not exceed ${max} characters` }),

  description: (min = 10, max = 2000) => z.string()
    .min(min, { message: `Description must be at least ${min} characters long` })
    .max(max, { message: `Description must not exceed ${max} characters` }),

  amount: (min = 50, max = 100000) => z.number()
    .min(min, { message: `Amount must be at least $${min}` })
    .max(max, { message: `Amount cannot exceed $${max}` }),

  url: () => z.string()
    .optional()
    .refine((val) => !val || validationPatterns.url.test(val), { message: 'Please enter a valid URL' }),

  phone: () => z.string()
    .optional()
    .refine((val) => !val || validationPatterns.phone.test(val), { message: 'Please enter a valid phone number' })
};

// Form-specific schemas
export const authSchemas = {
  register: () => z.object({
    email: commonSchemas.email(),
    password: commonSchemas.password(),
    firstName: commonSchemas.firstName(),
    lastName: commonSchemas.lastName(),
    role: z.enum(['client', 'freelancer'], { 
      errorMap: () => ({ message: 'Please select your role' }) 
    })
  }),

  login: () => z.object({
    email: commonSchemas.email(),
    password: z.string().min(1, { message: 'Password is required' })
  }),

  forgotPassword: () => z.object({
    email: commonSchemas.email()
  }),

  resetPassword: () => z.object({
    password: commonSchemas.password(),
    confirmPassword: z.string()
  }).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  })
};

export const projectSchemas = {
  create: () => z.object({
    title: commonSchemas.title(2, 100),
    description: commonSchemas.description(10, 2000),
    category: z.string().min(1, { message: 'Category is required' }),
    totalBudget: commonSchemas.amount(50, 100000),
    timeline: z.string().min(1, { message: 'Timeline is required' }),
  }),

  milestone: () => z.object({
    title: commonSchemas.title(2, 100),
    description: commonSchemas.description(10, 500),
    amount: commonSchemas.amount(50, 100000),
    deadline: z.string().min(1, { message: 'Deadline is required' }),
    acceptanceCriteria: z.string().max(1000, { message: 'Acceptance criteria must not exceed 1000 characters' }),
  })
};

export const milestoneSchemas = {
  submit: () => z.object({
    notes: z.string().max(1000, { message: 'Submission notes must not exceed 1000 characters' }),
    acceptanceCriteriaMet: z.boolean().refine(val => val === true, {
      message: 'You must confirm that all acceptance criteria have been met'
    }),
    files: z.array(z.instanceof(File))
      .min(1, { message: 'At least one file must be uploaded' })
      .max(5, { message: 'Maximum 5 files allowed' })
  })
};

export const paymentSchemas = {
  deposit: () => z.object({
    amount: commonSchemas.amount(50, 100000),
    currency: z.string().min(1, { message: 'Currency is required' }),
    paymentMethodId: z.string().min(1, { message: 'Payment method is required' })
  }),

  enhancedDeposit: () => z.object({
    amount: z.number()
      .min(0.01, { message: 'Amount must be greater than 0' })
      .max(100000, { message: 'Amount cannot exceed $100,000' }),
    currency: z.string().min(1, { message: 'Currency is required' }),
    paymentMethodId: z.string().min(1, { message: 'Payment method is required' })
  })
};

// Utility function to validate form data
export const validateFormData = <T extends Record<string, any>>(
  data: T,
  schema: z.ZodSchema<T>
): { success: boolean; data?: T; errors?: Record<string, string> } => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.errors.forEach((err) => {
        if (err.path) {
          const field = err.path[0] as string;
          errors[field] = err.message;
        }
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

// Custom hook for form validation
export const useFormValidator = <T extends Record<string, any>>(
  schema: z.ZodSchema<T>
) => {
  const validate = (data: T): { success: boolean; errors?: Record<string, string> } => {
    return validateFormData(data, schema);
  };

  return { validate };
};