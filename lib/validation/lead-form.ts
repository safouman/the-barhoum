import { z } from "zod";

export const leadFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(1, "Full name is required")
    .max(200, "Full name must be less than 200 characters"),

  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid email address")
    .max(255, "Email must be less than 255 characters"),

  country: z
    .string()
    .trim()
    .min(1, "Country is required")
    .max(100, "Country must be less than 100 characters"),

  phone: z
    .string()
    .trim()
    .max(50, "Phone number must be less than 50 characters")
    .optional()
    .transform((val) => val || ""),

  age: z
    .string()
    .trim()
    .min(1, "Age is required")
    .refine((val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 12 && num <= 150;
    }, "Please enter a valid age (12+)"),

  bestContactTime: z
    .string()
    .trim()
    .min(1, "Preferred contact time is required")
    .max(500, "Contact time must be less than 500 characters"),

  psychologistBefore: z
    .string()
    .trim()
    .min(1, "This field is required")
    .max(1000, "Response must be less than 1000 characters"),

  medicationNow: z
    .string()
    .trim()
    .min(1, "This field is required")
    .max(1000, "Response must be less than 1000 characters"),

  whyCoaching: z
    .string()
    .trim()
    .min(1, "This field is required")
    .max(2000, "Response must be less than 2000 characters"),

  followingDuration: z
    .string()
    .trim()
    .min(1, "This field is required")
    .max(200, "Response must be less than 200 characters"),

  maritalStatus: z
    .string()
    .trim()
    .min(1, "Marital status is required")
    .max(50, "Marital status must be less than 50 characters"),

  occupation: z
    .string()
    .trim()
    .min(1, "Occupation is required")
    .max(200, "Occupation must be less than 200 characters"),

  passphrase: z
    .string()
    .trim()
    .max(1000, "Passphrase must be less than 1000 characters")
    .optional()
    .transform((val) => val || ""),

  category: z.string().optional().transform((val) => val || ""),

  package: z.string().optional().transform((val) => val || ""),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;
