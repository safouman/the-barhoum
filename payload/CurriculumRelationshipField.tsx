"use client";

import { Button, RelationshipField, useAuth, useDocumentDrawer, useDocumentInfo, useField } from "@payloadcms/ui";
import type { RelationshipFieldClientProps } from "payload";

export function CurriculumRelationshipField(props: RelationshipFieldClientProps) {
    const { id: courseID } = useDocumentInfo();
    const { permissions } = useAuth();
    const { disabled, setValue, value } = useField<number | string | null>({ potentiallyStalePath: props.path });
    const collection = props.field.relationTo === "modules" ? "modules" : "lessons";
    const label = collection === "modules" ? "module" : "lesson";
    const selectedID = Number(value) || undefined;
    const [Drawer, , { closeDrawer, openDrawer }] = useDocumentDrawer({ collectionSlug: collection });
    const [EditDrawer, , { closeDrawer: closeEdit, openDrawer: openEdit }] = useDocumentDrawer({
        collectionSlug: collection,
        id: selectedID,
    });

    return (
        <>
            <RelationshipField {...props} />
            {selectedID !== undefined && permissions?.collections?.[collection]?.update && (
                <>
                    <Button buttonStyle="secondary" size="small" onClick={openEdit}>Edit selected {label}</Button>
                    <EditDrawer onSave={closeEdit} />
                </>
            )}
            {courseID != null && !props.readOnly && !disabled && permissions?.collections?.[collection]?.create && (
                <>
                    <Button buttonStyle="secondary" size="small" onClick={openDrawer}>
                        Create {label} for this course
                    </Button>
                    <Drawer
                        initialData={{ course: courseID }}
                        onSave={({ doc }) => {
                            setValue(doc.id);
                            closeDrawer();
                        }}
                    />
                </>
            )}
        </>
    );
}
