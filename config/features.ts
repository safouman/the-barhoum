const truthyValues = new Set(["1", "true", "yes", "on"]);
const falsyValues = new Set(["0", "false", "no", "off"]);

function parseBooleanFlag(
    rawValue: string | undefined,
    defaultValue: boolean
): boolean {
    if (!rawValue) {
        return defaultValue;
    }

    const normalized = rawValue.trim().toLowerCase();

    if (truthyValues.has(normalized)) {
        return true;
    }

    if (falsyValues.has(normalized)) {
        return false;
    }

    return defaultValue;
}

const aieoEnabled = parseBooleanFlag(
    process.env.NEXT_PUBLIC_ENABLE_AIEO,
    true
);

export const featureFlags = Object.freeze({
    aieo: aieoEnabled,
});

export const isAieoEnabled = featureFlags.aieo;

export type FeatureFlags = typeof featureFlags;
