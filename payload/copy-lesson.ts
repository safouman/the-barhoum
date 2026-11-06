import { APIError, type Endpoint } from "payload";
import type { Lesson } from "../payload-types.ts";
import { relationshipID } from "./curriculum.ts";

function numericID(value: unknown) {
    const id = typeof value === "string" && /^[1-9]\d*$/.test(value) ? Number(value) : value;
    if (typeof id !== "number" || !Number.isInteger(id) || id < 1 || id > 2147483647) {
        throw new APIError("Select a valid course or lesson.", 400);
    }
    return id;
}

function copyContent(content: Lesson["content"]) {
    // Payload's PostgreSQL block rows need new IDs, while relationship IDs must be preserved.
    return content?.map(({ id: _id, ...block }) => {
        switch (block.blockType) {
            case "video":
                return { ...block, videos: block.videos.map(({ id: _id, ...video }) => video) };
            case "resources":
                return { ...block, items: block.items.map(({ id: _id, ...item }) => item) };
            default:
                return block;
        }
    });
}

export const copyLessonEndpoint: Endpoint = {
    path: "/:id/copy-to-course",
    method: "post",
    handler: async (req) => {
        if (req.user?.collection !== "admins") throw new APIError("Administrator access is required.", 403);
        const sourceID = numericID(req.routeParams?.id);
        let destination: unknown;
        try {
            destination = (await req.json?.())?.course;
        } catch {
            throw new APIError("Send a valid destination course.", 400);
        }
        const course = numericID(destination);
        const source = await req.payload.findByID({
            collection: "lessons", id: sourceID, draft: true, depth: 0, overrideAccess: false, req,
        });
        if (String(relationshipID(source.course)) === String(course)) {
            throw new APIError("Choose a different course.", 400);
        }
        const copy = await req.payload.create({
            collection: "lessons", draft: true, depth: 0, overrideAccess: false, req,
            data: {
                course,
                title: source.title,
                description: source.description,
                freePreview: source.freePreview,
                content: copyContent(source.content),
                _status: "draft",
            },
        });
        return Response.json({ id: copy.id }, { status: 201 });
    },
};
