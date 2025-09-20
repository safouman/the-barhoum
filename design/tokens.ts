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
    pageGradient?: string;
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
      background: "#0b0d0d",
      surface: "#141919",
      text: "#f3f1eb",
      subtle: "#a59c91",
      accent: "#29d6c7",
      accentText: "#0f4540",
      border: "#223432",
      focus: "#4de6d9",
      pageGradient: "#0b0d0d"
    },
    font: {
      familyBase: "var(--font-inter)",
      familyHeading: "var(--font-playfair)",
      weightRegular: 400,
      weightBold: 600
    },
    radius: {
      sm: "12px",
      md: "20px",
      lg: "32px"
    },
    shadow: {
      sm: "0 18px 50px rgba(15,15,15,0.32)",
      md: "0 26px 80px rgba(12,12,12,0.45)"
    },
    spacing: {
      xs: "0.75rem",
      sm: "1.5rem",
      md: "3rem",
      lg: "5rem",
      xl: "7.5rem"
    },
    lineHeight: {
      tight: 1.2,
      base: 1.6,
      relaxed: 1.9
    }
  },
  b: {
    color: {
      background: "#ffffff",
      surface: "#f8f8f8",
      text: "#1d1c1a",
      subtle: "#64645f",
      accent: "#2fb9ad",
      accentText: "#103d39",
      border: "#e4e4e3",
      focus: "#2fb9ad",
      pageGradient: "#ffffff"
    },
    font: {
      familyBase: "var(--font-poppins)",
      familyHeading: "var(--font-poppins)",
      weightRegular: 400,
      weightBold: 600
    },
    radius: {
      sm: "10px",
      md: "18px",
      lg: "26px"
    },
    shadow: {
      sm: "0 16px 36px rgba(13, 28, 28, 0.12)",
      md: "0 28px 60px rgba(20, 35, 35, 0.16)"
    },
    spacing: {
      xs: "0.75rem",
      sm: "1.5rem",
      md: "3rem",
      lg: "5rem",
      xl: "7rem"
    },
    lineHeight: {
      tight: 1.15,
      base: 1.6,
      relaxed: 1.85
    }
  },
  c: {
    color: {
      background: "#f2e6db",
      surface: "#fff3ea",
      text: "#3f342c",
      subtle: "#2f7d73",
      accent: "#e27e6d",
      accentText: "#ffffff",
      border: "#e8d6c7",
      focus: "#29d6c7",
      pageGradient: "#f2e6db"
    },
    font: {
      familyBase: "var(--font-nunito)",
      familyHeading: "var(--font-rubik)",
      weightRegular: 400,
      weightBold: 700
    },
    radius: {
      sm: "14px",
      md: "22px",
      lg: "30px"
    },
    shadow: {
      sm: "0 18px 42px rgba(226,126,109,0.18)",
      md: "0 30px 68px rgba(226,126,109,0.22)"
    },
    spacing: {
      xs: "0.75rem",
      sm: "1.75rem",
      md: "3.25rem",
      lg: "5.25rem",
      xl: "7.5rem"
    },
    lineHeight: {
      tight: 1.2,
      base: 1.65,
      relaxed: 1.95
    }
  }
};
