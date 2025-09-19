import { TOKENS, ThemeName } from "./tokens";

export const THEME_NAMES = ["a", "b", "c"] as const satisfies readonly ThemeName[];

export function getThemeVars(theme: ThemeName): Record<string, string | number> {
  const tokens = TOKENS[theme];
  return {
    "--color-background": tokens.color.background,
    "--color-surface": tokens.color.surface,
    "--color-text": tokens.color.text,
    "--color-subtle": tokens.color.subtle,
    "--color-accent": tokens.color.accent,
    "--color-accent-text": tokens.color.accentText,
    "--color-border": tokens.color.border,
    "--color-focus": tokens.color.focus,
    "--page-gradient": tokens.color.pageGradient ?? tokens.color.background,
    "--font-base": tokens.font.familyBase,
    "--font-heading": tokens.font.familyHeading,
    "--font-weight-regular": tokens.font.weightRegular,
    "--font-weight-bold": tokens.font.weightBold,
    "--radius-sm": tokens.radius.sm,
    "--radius-md": tokens.radius.md,
    "--radius-lg": tokens.radius.lg,
    "--shadow-sm": tokens.shadow.sm,
    "--shadow-md": tokens.shadow.md,
    "--space-xs": tokens.spacing.xs,
    "--space-sm": tokens.spacing.sm,
    "--space-md": tokens.spacing.md,
    "--space-lg": tokens.spacing.lg,
    "--space-xl": tokens.spacing.xl,
    "--leading-tight": tokens.lineHeight.tight,
    "--leading-base": tokens.lineHeight.base,
    "--leading-relaxed": tokens.lineHeight.relaxed
  };
}
