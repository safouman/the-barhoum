"use client";

import { PublishButton, useDocumentInfo } from "@payloadcms/ui";

export function CourseGuide() {
    const { id } = useDocumentInfo();

    if (id == null) {
        return <p>Start with the course basics and choose a curriculum structure. Select Save Draft to open the Course Workspace.</p>;
    }

    return <p>Build the curriculum, review readiness, and publish when the content is ready. Manage prices and activate offers separately in Pricing.</p>;
}

export function CoursePublishButton() {
    const { id } = useDocumentInfo();

    return id == null ? null : <PublishButton />;
}
