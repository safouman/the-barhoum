export const courseStripeMarker = "barhoum-course-v1";

export function isCourseStripeMetadata(metadata: Record<string, string> | null | undefined) {
    return metadata?.barhoum_source === courseStripeMarker;
}

export function courseStripeMetadata(orderId: string) {
    return { barhoum_source: courseStripeMarker, barhoum_order_id: orderId };
}
