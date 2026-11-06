import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextVitals,
  { ignores: ["public/**"] },
  { rules: { "react/jsx-props-no-spreading": "off" } },
  // Keep the framework upgrade separate from refactoring existing UI effects.
  {
    files: [
      "components/LeadForm.tsx",
      "components/cookies/CookieConsentBanner.tsx",
      "components/home/sections/{About,ExperienceWave,LeadFormSection,Packages}.tsx",
      "providers/{analytics,locale}-provider.tsx",
    ],
    rules: { "react-hooks/set-state-in-effect": "off" },
  },
  {
    files: ["components/home/sections/ExperienceSection.tsx"],
    rules: { "react-hooks/refs": "off" },
  },
  {
    files: ["providers/analytics-provider.tsx"],
    rules: { "react-hooks/immutability": "off" },
  },
];

export default config;
