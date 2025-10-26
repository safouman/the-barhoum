"use client";

import { useEffect } from "react";
import { event } from "@/lib/analytics";

export function AIBriefViewTracker() {
    useEffect(() => {
        event("ai_brief_view", {
            page_path: window.location.pathname,
            page_location: window.location.href,
        });
    }, []);

    return null;
}
