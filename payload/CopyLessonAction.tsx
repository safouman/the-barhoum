"use client";

import { Button, toast, useConfig, useDocumentInfo, useListDrawer } from "@payloadcms/ui";
import { useMemo, useRef, useState } from "react";

export function CopyLessonAction() {
    const { id, savedDocumentData } = useDocumentInfo();
    const { config: { routes: { api, admin } } } = useConfig();
    const owner = savedDocumentData?.course;
    const ownerID = owner && typeof owner === "object" ? owner.id : owner;
    const filterOptions = useMemo(() => ownerID == null ? undefined : {
        courses: { id: { not_equals: ownerID } },
    }, [ownerID]);
    const [Drawer, , { openDrawer, closeDrawer }] = useListDrawer({
        collectionSlugs: ["courses"],
        selectedCollection: "courses",
        filterOptions,
    });
    const pending = useRef(false);
    const [busy, setBusy] = useState(false);
    const [copyID, setCopyID] = useState<number>();

    if (id == null) return null;

    return (
        <>
            <Button buttonStyle="secondary" size="small" disabled={busy} onClick={openDrawer}>
                Copy to course
            </Button>
            {copyID != null && <a href={`${admin}/collections/lessons/${copyID}`}>Open copied draft</a>}
            <Drawer allowCreate={false} onSelect={async ({ doc }) => {
                if (pending.current) return;
                pending.current = true;
                setBusy(true);
                closeDrawer();
                try {
                    const response = await fetch(`${api}/lessons/${id}/copy-to-course`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ course: doc.id }),
                    });
                    const result = await response.json();
                    if (!response.ok) {
                        throw new Error(result.errors?.[0]?.message ?? "Could not copy the lesson.");
                    }
                    setCopyID(result.id);
                    toast.success("Lesson copied as an unplaced draft.");
                } catch (error) {
                    toast.error(error instanceof Error ? error.message : "Could not copy the lesson.");
                } finally {
                    pending.current = false;
                    setBusy(false);
                }
            }} />
        </>
    );
}
