"use client";

import { Button, useAuth, useDocumentDrawer } from "@payloadcms/ui";
import { useRouter } from "next/navigation";

export function OfferDrawer({ courseID, moduleID, offerID }: {
    courseID: number | string;
    moduleID: number | null;
    offerID?: number;
}) {
    const { permissions } = useAuth();
    const router = useRouter();
    const [Drawer, , { closeDrawer, openDrawer }] = useDocumentDrawer({
        collectionSlug: "course-offers",
        id: offerID,
    });
    const operation = offerID === undefined ? "create" : "update";
    if (!permissions?.collections?.["course-offers"]?.[operation]) return null;

    return <>
        <Button buttonStyle="secondary" size="small" onClick={openDrawer}>
            {offerID === undefined ? "Create disabled offer" : "Edit offer"}
        </Button>
        <Drawer
            initialData={offerID === undefined ? { course: courseID, module: moduleID, enabled: false } : undefined}
            onSave={() => {
                closeDrawer();
                router.refresh();
            }}
        />
    </>;
}
