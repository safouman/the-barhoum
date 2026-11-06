import type { CollectionConfig } from "payload";

export const studentSessionLifetime = 14 * 24 * 60 * 60;
export const studentAgeRanges = ["under-18", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"] as const;
export const normalizeStudentEmail = (email: string) => email.trim().toLowerCase();

function resetTokenMinutes() {
    const configured = Number(process.env.STUDENT_RESET_TOKEN_MINUTES);
    return Number.isInteger(configured) && configured >= 5 && configured <= 60 ? configured : 30;
}

const deny = () => false;

export const Students: CollectionConfig = {
    slug: "students",
    endpoints: false,
    admin: { hidden: true, disableCopyToLocale: true },
    access: { admin: deny, create: deny, read: deny, update: deny, delete: deny },
    auth: {
        verify: true,
        useSessions: true,
        tokenExpiration: studentSessionLifetime,
        maxLoginAttempts: 0,
        forgotPassword: { expiration: resetTokenMinutes() * 60_000, minRequestInterval: 0 },
    },
    hooks: {
        beforeValidate: [({ data }) => {
            if (typeof data?.email === "string") data.email = normalizeStudentEmail(data.email);
            return data;
        }],
    },
    fields: [
        { name: "name", type: "text", required: true, maxLength: 120 },
        { name: "city", type: "text", maxLength: 120 },
        { name: "ageRange", type: "select", options: [...studentAgeRanges] },
        { name: "picture", type: "text" },
        { name: "hasPassword", type: "checkbox", required: true, defaultValue: false },
        { name: "googleSubject", type: "text", unique: true, maxLength: 255 },
    ],
};
