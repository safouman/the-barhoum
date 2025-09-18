export type ThemeName = "a" | "b" | "c";

export type DesignTokens = {
  color: {
    background: string;
    surface: string;
    text: string;
    subtle: string;
    accent: string;
    accentText: string;
    border: string;
    focus: string;
  };
  font: {
    familyBase: string;
    familyHeading: string;
    weightRegular: number;
    weightBold: number;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadow: {
    sm: string;
    md: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  lineHeight: {
    tight: number;
    base: number;
    relaxed: number;
  };
};

export const TOKENS: Record<ThemeName, DesignTokens> = {
  a: {
    color: {
      background: "#141312",
      surface: "#1f1d1b",
      text: "#f8f4ec",
      subtle: "#d2c6ad",
      accent: "#c7a764",
      accentText: "#141312",
      border: "#3b352f",
      focus: "#f5c16c"
    },
    font: {
      familyBase: "'Georgia', 'Times New Roman', serif",
      familyHeading: "'Didot', 'Georgia', serif",
      weightRegular: 400,
      weightBold: 600
    },
    radius: {
      sm: "8px",
      md: "16px",
      lg: "32px"
    },
    shadow: {
      sm: "0 8px 16px rgba(0,0,0,0.2)",
      md: "0 16px 40px rgba(0,0,0,0.35)"
    },
    spacing: {
      xs: "0.5rem",
      sm: "0.75rem",
      md: "1.5rem",
      lg: "2.5rem",
      xl: "4rem"
    },
    lineHeight: {
      tight: 1.2,
      base: 1.5,
      relaxed: 1.8
    }
  },
  b: {
    color: {
      background: "#f7f7f7",
      surface: "#ffffff",
      text: "#0f172a",
      subtle: "#475569",
      accent: "#2563eb",
      accentText: "#ffffff",
      border: "#e2e8f0",
      focus: "#3b82f6"
    },
    font: {
      familyBase: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
      familyHeading: "'Segoe UI Semibold', 'Helvetica Neue', Arial, sans-serif",
      weightRegular: 400,
      weightBold: 700
    },
    radius: {
      sm: "6px",
      md: "12px",
      lg: "20px"
    },
    shadow: {
      sm: "0 6px 12px rgba(15,23,42,0.08)",
      md: "0 12px 24px rgba(15,23,42,0.12)"
    },
    spacing: {
      xs: "0.5rem",
      sm: "1rem",
      md: "1.5rem",
      lg: "2rem",
      xl: "3rem"
    },
    lineHeight: {
      tight: 1.1,
      base: 1.6,
      relaxed: 1.9
    }
  },
  c: {
    color: {
      background: "#faf5ef",
      surface: "#fff9f2",
      text: "#3a2f2a",
      subtle: "#8f7765",
      accent: "#ec9f66",
      accentText: "#3a2f2a",
      border: "#f2dfcf",
      focus: "#f1b37a"
    },
    font: {
      familyBase: "'Tahoma', 'Verdana', sans-serif",
      familyHeading: "'Trebuchet MS', 'Tahoma', sans-serif",
      weightRegular: 400,
      weightBold: 700
    },
    radius: {
      sm: "10px",
      md: "20px",
      lg: "28px"
    },
    shadow: {
      sm: "0 6px 14px rgba(236,159,102,0.18)",
      md: "0 14px 30px rgba(236,159,102,0.24)"
    },
    spacing: {
      xs: "0.75rem",
      sm: "1.25rem",
      md: "1.75rem",
      lg: "2.5rem",
      xl: "3.5rem"
    },
    lineHeight: {
      tight: 1.15,
      base: 1.7,
      relaxed: 2
    }
  }
};
