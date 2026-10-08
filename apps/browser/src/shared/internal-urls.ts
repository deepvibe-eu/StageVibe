/**
 * Internal URLs used by the browser.
 * These URLs are handled specially by the browser and don't navigate to external sites.
 */

/** The home page URL - displayed when opening a new tab or on startup */
export const HOME_PAGE_URL = 'stagevibe://internal/home';

/**
 * Checks if a URL is an internal stagevibe URL (or a legacy stagewise URL).
 */
export function isInternalUrl(url: string): boolean {
  return url.startsWith('stagevibe://') || url.startsWith('stagewise://');
}

/**
 * Checks if a URL is the home page.
 */
export function isHomePage(url: string): boolean {
  return url === HOME_PAGE_URL;
}
