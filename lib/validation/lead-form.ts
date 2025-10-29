import { z } from "zod";
import { COUNTRY_OPTIONS } from "@/lib/constants/lead-form";

const countryOptionsSet = new Set<string>(COUNTRY_OPTIONS);
const MIN_PHONE_DIGITS = 8;

export const leadFormSchema = z.object({
    leadId: z
        .string()
        .trim()
        .min(1, "Lead identifier is required")
        .max(100, "Lead identifier must be less than 100 characters"),

    fullName: z
        .string()
        .trim()
        .min(1, "Full name is required")
        .max(200, "Full name must be less than 200 characters"),

    gender: z
        .string()
        .trim()
        .min(1, "Gender is required")
        .max(100, "Gender must be less than 100 characters"),

    ageGroup: z
        .string()
        .trim()
        .min(1, "Age group is required")
        .max(120, "Age group must be less than 120 characters"),

    country: z
        .string()
        .trim()
        .min(1, "Country is required")
        .max(100, "Country must be less than 100 characters")
        .refine(
            (val) => countryOptionsSet.has(val),
            "Please select a valid country"
        ),

    specialization: z
        .string()
        .trim()
        .min(1, "Specialization is required")
        .max(200, "Specialization must be less than 200 characters"),

    socialFamiliarity: z
        .string()
        .trim()
        .min(1, "Social familiarity is required")
        .max(200, "Social familiarity must be less than 200 characters"),

    previousTraining: z
        .string()
        .trim()
        .min(1, "Previous training response is required")
        .max(2000, "Previous training response must be less than 2000 characters"),

    awarenessLevel: z
        .string()
        .trim()
        .min(1, "Awareness level is required")
        .max(200, "Awareness level must be less than 200 characters"),

    phone: z
        .string()
        .trim()
        .min(1, "WhatsApp number is required")
        .max(50, "Phone number must be less than 50 characters")
        .refine(
            (val) => val.replace(/\D/g, "").length >= MIN_PHONE_DIGITS,
            "Please enter a valid phone number"
        ),

    bestContactTime: z
        .string()
        .trim()
        .min(1, "Preferred contact time is required")
        .max(500, "Contact time must be less than 500 characters"),

    category: z.string().optional().transform((val) => val || ""),

    package: z.string().optional().transform((val) => val || ""),

    packageId: z.string().optional().transform((val) => val || ""),
});

export type LeadFormData = z.infer<typeof leadFormSchema>;
