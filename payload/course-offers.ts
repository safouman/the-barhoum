import { ValidationError, type CollectionConfig } from "payload";
import { adminAccess } from "./collections.ts";
import { relationshipID } from "./curriculum.ts";

const priceID = /^price_[A-Za-z0-9]{1,100}$/;

function invalid(path: string, message: string): never {
    throw new ValidationError({ errors: [{ path, message }] });
}

export const CourseOffers: CollectionConfig = {
    slug: "course-offers",
    access: adminAccess,
    disableDuplicate: true,
    admin: { useAsTitle: "stripePriceId", defaultColumns: ["course", "module", "enabled", "stripePriceId"] },
    hooks: {
        beforeChange: [async ({ data, originalDoc, req }) => {
            const course = relationshipID(data.course ?? originalDoc?.course);
            const moduleID = relationshipID(data.module === undefined ? originalDoc?.module : data.module);
            if (originalDoc && (String(course) !== String(relationshipID(originalDoc.course)) ||
                String(moduleID) !== String(relationshipID(originalDoc.module)))) {
                invalid("course", "The target is fixed. Disable this offer and create one for the new target.");
            }
            if (moduleID != null) {
                const candidate = await req.payload.findByID({
                    collection: "modules", id: moduleID, req, depth: 0, draft: false, disableErrors: true,
                });
                if (!candidate || String(relationshipID(candidate.course)) !== String(course) ||
                    (candidate.classification !== "premium" && !(originalDoc && data.enabled === false))) {
                    invalid("module", "Choose a premium module belonging to this course to enable the offer.");
                }
            }
            return data;
        }],
    },
    fields: [
        { name: "course", type: "relationship", relationTo: "courses", required: true },
        {
            name: "module", type: "relationship", relationTo: "modules",
            admin: { description: "Leave empty for base course access. Select a premium module for an upgrade." },
        },
        { name: "enabled", type: "checkbox", defaultValue: false, required: true },
        { name: "stripePriceId", type: "text", required: true, validate: (value: unknown) => typeof value === "string" && priceID.test(value) || "Enter a Stripe Price ID." },
    ],
};
