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

const stripeEnabled = parseBooleanFlag(
    process.env.NEXT_PUBLIC_ENABLE_STRIPE ?? process.env.ENABLE_STRIPE,
    true
);

const audioExperienceEnabled = parseBooleanFlag(
    process.env.NEXT_PUBLIC_SHOW_AUDIO_EXPERIENCE,
    true
);

export const featureFlags = Object.freeze({
    aieo: aieoEnabled,
    stripe: stripeEnabled,
    audioExperience: audioExperienceEnabled,
});

export const isAieoEnabled = featureFlags.aieo;
export const isStripeEnabled = featureFlags.stripe;
export const isAudioExperienceEnabled = featureFlags.audioExperience;

export type FeatureFlags = typeof featureFlags;
