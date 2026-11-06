import { ValidationError, type ArrayField, type CollectionBeforeChangeHook, type CollectionBeforeDeleteHook, type Field, type FilterOptions } from "payload";
import { z } from "zod";

const relationship = z.union([z.number().int().positive().max(2147483647), z.string().regex(/^[1-9]\d{0,9}$/).refine((value) => Number(value) <= 2147483647)]).nullish();
const lessonPlacement = z.object({ lesson: relationship });
const modulePlacement = z.object({
    module: relationship,
    lessons: z.array(lessonPlacement).nullish(),
});
const curriculum = z.object({
    structure: z.enum(["simple", "modular", "structured"]),
    lessons: z.array(lessonPlacement).nullish(),
    modules: z.array(modulePlacement).nullish(),
    parts: z.array(z.object({ modules: z.array(modulePlacement).nullish() })).nullish(),
});

function curriculumError(message: string): never {
    throw new ValidationError({ errors: [{ path: "structure", message }] });
}

export function relationshipID(value: unknown): number | string | undefined {
    if (value && typeof value === "object" && "id" in value) {
        return relationshipID(value.id);
    }
    return typeof value === "number" || typeof value === "string" ? value : undefined;
}

function references(data: z.infer<typeof curriculum>) {
    const modules = data.structure === "structured"
        ? (data.parts ?? []).flatMap((part) => part.modules ?? [])
        : data.structure === "modular" ? data.modules ?? [] : [];
    const lessons = data.structure === "simple"
        ? data.lessons ?? []
        : modules.flatMap((module) => module.lessons ?? []);
    return {
        modules: modules.flatMap((row) => row.module == null ? [] : [String(row.module)]),
        lessons: lessons.flatMap((row) => row.lesson == null ? [] : [String(row.lesson)]),
    };
}

export const validateCurriculum: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
    const proposed = { ...originalDoc, ...data };
    const parsed = curriculum.safeParse(proposed);
    if (!parsed.success) {
        curriculumError("Select a course structure and use valid curriculum placements.");
    }

    const ids = references(parsed.data);
    for (const collection of ["modules", "lessons"] as const) {
        const placed = ids[collection];
        if (placed.length === 0) continue;
        if (new Set(placed).size !== placed.length) {
            curriculumError(`A course cannot contain duplicate ${collection}.`);
        }
        const course = originalDoc?.id;
        if (!course) curriculumError("Save the course before assigning modules or lessons.");
        const { totalDocs } = await req.payload.find({
            collection,
            depth: 0,
            draft: collection === "lessons",
            limit: 1,
            overrideAccess: true,
            req,
            where: { id: { in: placed }, course: { equals: course } },
        });
        if (totalDocs !== placed.length) {
            curriculumError(`All placed ${collection} must belong to this course.`);
        }
    }

    if (proposed._status === "published") {
        return {
            ...data,
            lessons: proposed.structure === "simple" ? proposed.lessons : [],
            modules: proposed.structure === "modular" ? proposed.modules : [],
            parts: proposed.structure === "structured" ? proposed.parts : [],
        };
    }
    return data;
};

const ownedByEditedCourse: FilterOptions = ({ id }) =>
    id == null ? false : { course: { equals: id } };

function lessonRows(name: string): ArrayField {
    return {
        name,
        type: "array",
        fields: [{
            name: "lesson",
            type: "relationship",
            relationTo: "lessons",
            required: true,
            filterOptions: ownedByEditedCourse,
        }],
    };
}

function moduleRows(name: string): ArrayField {
    return {
        name,
        type: "array",
        fields: [
            {
                name: "module",
                type: "relationship",
                relationTo: "modules",
                required: true,
                filterOptions: ownedByEditedCourse,
            },
            lessonRows("lessons"),
        ],
    };
}

export const curriculumFields: Field[] = [
    {
        name: "structure",
        type: "select",
        options: ["simple", "modular", "structured"],
        defaultValue: "simple",
        required: true,
        admin: {
            description: "Save the course before adding module or lesson placements. To reorganize a course, select the new structure and reselect existing records before publishing.",
        },
    },
    { ...lessonRows("lessons"), admin: { condition: (data) => data.structure === "simple" } },
    { ...moduleRows("modules"), admin: { condition: (data) => data.structure === "modular" } },
    {
        name: "parts",
        type: "array",
        admin: { condition: (data) => data.structure === "structured" },
        fields: [
            { name: "title", type: "text", required: true },
            moduleRows("modules"),
        ],
    },
];

export function protectPlacedRecord(collection: "modules" | "lessons"): CollectionBeforeDeleteHook {
    return async ({ id, req }) => {
        const record = await req.payload.findByID({
            collection, id, depth: 0, draft: collection === "lessons", req,
        });
        const courseID = relationshipID(record.course);
        if (courseID == null) return;
        for (const draft of [false, true]) {
            const course = await req.payload.findByID({
                collection: "courses", id: courseID, depth: 0, draft, disableErrors: true, req,
            });
            const result = curriculum.safeParse(course);
            if (result.success && references(result.data)[collection].includes(String(id))) {
                curriculumError("Remove this record from both the published curriculum and its draft before deleting it.");
            }
        }
    };
}

export const keepCourseOwnership: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
    const previous = relationshipID(originalDoc?.course);
    const next = data.course === undefined ? previous : relationshipID(data.course);
    if (previous !== undefined && String(next) !== String(previous)) {
        throw new ValidationError({ errors: [{ path: "course", message: "The owning course cannot be changed." }] });
    }
    if (previous === undefined) {
        const id = relationship.safeParse(next);
        const course = id.success && id.data != null && await req.payload.findByID({
            collection: "courses", id: id.data, depth: 0, draft: true, disableErrors: true, req,
        });
        if (!course) {
            throw new ValidationError({ errors: [{ path: "course", message: "Select an existing owning course." }] });
        }
    }
    return data;
};
