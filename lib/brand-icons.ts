// Original crops are retained. Six module assets use alpha-refined derivatives;
// see public/images/brand-icons/{source.json,transparent/source.json}.
export const brandIconAssets = {
  "emotional-intelligence": { src: "/images/brand-icons/transparent/emotional-intelligence.png", width: 305, height: 236 },
  "people-management": { src: "/images/brand-icons/people-management.png", width: 293, height: 216 },
  "organizational-dynamics": { src: "/images/brand-icons/transparent/organizational-dynamics.png", width: 269, height: 191 },
  "professional-growth": { src: "/images/brand-icons/transparent/professional-growth.png", width: 262, height: 239 },
  "performance-focus": { src: "/images/brand-icons/transparent/performance-focus.png", width: 249, height: 237 },
  "communication-influence": { src: "/images/brand-icons/transparent/communication-influence.png", width: 288, height: 206 },
  "leadership": { src: "/images/brand-icons/leadership.png", width: 283, height: 229 },
  "learning-development": { src: "/images/brand-icons/learning-development.png", width: 273, height: 253 },
  "wellbeing-self-regulation": { src: "/images/brand-icons/transparent/wellbeing-self-regulation.png", width: 233, height: 219 },
  "mind-heart-integration": { src: "/images/brand-icons/mind-heart-integration.png", width: 311, height: 141 },
} as const;
export type BrandIconName = keyof typeof brandIconAssets;

// These keys assign artwork; displayed titles and curriculum still come from Payload.
export const programModuleIcons: Readonly<Record<string, BrandIconName>> = {
  "Understand Yourself to Act Better": "emotional-intelligence",
  "Decode Organizational Dynamics": "organizational-dynamics",
  "Communicate with Intelligence": "communication-influence",
  "Master Your Presence in Meetings": "performance-focus",
  "Manage Pressure & Difficult Relationships": "wellbeing-self-regulation",
  "Build Your Professional Growth Plan": "professional-growth",
};
