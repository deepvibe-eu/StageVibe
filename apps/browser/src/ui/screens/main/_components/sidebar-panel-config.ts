export const SIDEBAR_PANEL_ID = 'new-sidebar-panel';
export const SIDEBAR_PANEL_ORDER = 0;
export const DEFAULT_EXPANDED_SIDEBAR_SIZE = 18;
export const SIDEBAR_PANEL_MIN_SIZE = 6;
export const SIDEBAR_PANEL_MAX_SIZE = 50;
export const SIDEBAR_PANEL_CLASS_NAME =
  '@container group overflow-visible! relative flex h-full min-w-44 max-w-2xl flex-col items-stretch rounded-lg bg-background ring-1 ring-derived-subtle p-2';

/**
 * Applied while the sidebar is collapsed. The expanded class carries padding,
 * a ring, a background and `min-w-44`, which keep a visible strip even at
 * width 0; the collapsed variant is a bare, zero-width box so the panel
 * disappears completely (like `browser-tree-panel`).
 */
export const SIDEBAR_PANEL_COLLAPSED_CLASS_NAME =
  'relative flex h-full min-w-0 flex-col items-stretch overflow-hidden';
