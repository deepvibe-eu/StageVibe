/**
 * Shared theme colors used throughout the application.
 * These colors are used for window backgrounds and webcontents backgrounds
 * to ensure consistent theming across light and dark modes.
 *
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Run "pnpm generate:theme-colors" in packages/stage-ui to regenerate.
 * Source: packages/stage-ui/src/palette.css and theme.css
 */

export const THEME_COLORS = {
  light: {
    background: '#f2f2f1', // theme.css: --color-app-background → --color-base-100
    titleBarOverlay: {
      color: '#f2f2f1', // theme.css: --color-app-background → --color-base-100
      symbolColor: '#161515', // theme.css: --color-foreground → --color-base-900
    },
  },
  dark: {
    background: '#2d2c2c', // theme.css: --color-app-background → --color-base-700
    titleBarOverlay: {
      color: '#2d2c2c', // theme.css: --color-app-background → --color-base-700
      symbolColor: '#d8d7d6', // theme.css: --color-foreground → --color-base-200
    },
  },
} as const;
