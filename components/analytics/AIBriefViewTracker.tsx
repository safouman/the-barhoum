"use client";

import { useEffect } from "react";
import { event } from "@/lib/analytics";

export function AIBriefViewTracker() {
    useEffect(() => {
        event("ai_brief_view");
    }, []);

    return null;
}
