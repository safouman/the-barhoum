/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./providers/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        text: "var(--color-text)",
        subtle: "var(--color-subtle)",
        accent: "var(--color-accent)",
        accentText: "var(--color-accent-text)",
        border: "var(--color-border)",
        focus: "var(--color-focus)",
      },
      fontFamily: {
        base: ["var(--font-base)", "sans-serif"],
        heading: ["var(--font-heading)", "sans-serif"],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
      },
      spacing: {
        xs: "var(--space-xs)",
        sm: "var(--space-sm)",
        md: "var(--space-md)",
        lg: "var(--space-lg)",
        xl: "var(--space-xl)",
      },
      lineHeight: {
        tight: "var(--leading-tight)",
        relaxed: "var(--leading-relaxed)",
        base: "var(--leading-base)",
      },
    },
  },
  plugins: [],
};
