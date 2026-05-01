import { z } from 'zod';

const phonePattern = /^[+]?[0-9]{9,15}$/;

export const loginSchema = z.object({
  phone: z.string().min(9, 'Phone number must be at least 9 digits').max(10, 'Phone number must be at most 10 digits'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  phone: z.string().min(9, 'Phone number must be at least 9 digits').max(10, 'Phone number must be at most 10 digits'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  password_confirm: z.string().min(8, 'Password must be at least 8 characters'),
  otp_delivery_method: z.enum(['sms', 'email']),
}).refine((data) => data.password === data.password_confirm, {
  message: "Passwords don't match",
  path: ['password_confirm'],
});

export const otpRequestSchema = z
  .object({
    identifier: z.string().trim().min(1, 'Phone number or email is required'),
    delivery_method: z.enum(['sms', 'email']),
  })
  .superRefine((data, ctx) => {
    if (data.delivery_method === 'sms' && !phonePattern.test(data.identifier)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid phone number',
        path: ['identifier'],
      });
    }

    if (data.delivery_method === 'email') {
      const emailCheck = z.string().email('Enter a valid email address').safeParse(data.identifier);
      if (!emailCheck.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Enter a valid email address',
          path: ['identifier'],
        });
      }
    }
  });

export const otpVerificationSchema = z.object({
  identifier: z.string().trim().min(1, 'Phone number or email is required'),
  code: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export const forgotPasswordSchema = z.object({
  identifier: z.string().min(1, 'Phone number or email is required'),
});

export const resetPasswordSchema = z.object({
  code: z.string().length(6, 'Reset code must be 6 digits'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  new_password_confirm: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.new_password === data.new_password_confirm, {
  message: "Passwords don't match",
  path: ['new_password_confirm'],
});

export const chamaSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  county: z.string().min(1, 'County is required'),
  subcounty: z.string().min(1, 'Subcounty is required'),
  currency: z.string().min(1, 'Currency is required'),
});

export const contributionSchema = z.object({
  member_id: z.string().uuid('Invalid member ID'),
  contribution_type_id: z.string().uuid('Invalid contribution type ID'),
  amount: z.string().min(1, 'Amount is required'),
  date_paid: z.string().min(1, 'Date is required'),
  method: z.enum(['mpesa', 'cash']),
  receipt_code: z.string().min(1, 'Receipt code is required'),
});

export const loanRequestSchema = z.object({
  member_id: z.string().uuid('Invalid member ID').optional(),
  loan_product_id: z.string().uuid('Invalid loan product ID').optional(),
  principal: z.string().min(1, 'Principal amount is required'),
  duration_months: z.number().min(1, 'Duration must be at least 1 month'),
});

export const meetingSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  location: z.string().optional(),
  location_type: z.enum(['physical', 'online', 'hybrid']),
  meeting_link: z.string().url('Invalid URL').optional().or(z.literal('')),
});

export const profileUpdateSchema = z.object({
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

export const passwordChangeSchema = z.object({
  old_password: z.string().min(8, 'Password must be at least 8 characters'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
  new_password_confirm: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.new_password === data.new_password_confirm, {
  message: "Passwords don't match",
  path: ['new_password_confirm'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type OTPRequestFormData = z.infer<typeof otpRequestSchema>;
export type OTPVerificationFormData = z.infer<typeof otpVerificationSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type ChamaFormData = z.infer<typeof chamaSchema>;
export type ContributionFormData = z.infer<typeof contributionSchema>;
export type LoanRequestFormData = z.infer<typeof loanRequestSchema>;
export type MeetingFormData = z.infer<typeof meetingSchema>;
export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
