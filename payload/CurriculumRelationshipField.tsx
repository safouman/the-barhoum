"use client";

import { Button, RelationshipField, useAuth, useDocumentDrawer, useDocumentInfo, useField } from "@payloadcms/ui";
import type { RelationshipFieldClientProps } from "payload";

export function CurriculumRelationshipField(props: RelationshipFieldClientProps) {
    const { id: courseID } = useDocumentInfo();
    const { permissions } = useAuth();
    const { disabled, setValue } = useField({ potentiallyStalePath: props.path });
    const collection = props.field.relationTo === "modules" ? "modules" : "lessons";
    const label = collection === "modules" ? "module" : "lesson";
    const [Drawer, , { closeDrawer, openDrawer }] = useDocumentDrawer({ collectionSlug: collection });

    return (
        <>
            <RelationshipField {...props} />
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
