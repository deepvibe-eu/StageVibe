import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import enCommon from './locales/en/common.json';
import enSettings from './locales/en/settings.json';
import enChat from './locales/en/chat.json';
import enSidebar from './locales/en/sidebar.json';
import enTools from './locales/en/tools.json';
import enContent from './locales/en/content.json';
import enFileTree from './locales/en/fileTree.json';
import enFilePreview from './locales/en/filePreview.json';
import deCommon from './locales/de/common.json';
import deSettings from './locales/de/settings.json';
import deChat from './locales/de/chat.json';
import deSidebar from './locales/de/sidebar.json';
import deTools from './locales/de/tools.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const LANGUAGE_STORAGE_KEY = 'stagevibe-language';

export const NAMESPACES = [
  'common',
  'settings',
  'chat',
  'sidebar',
  'tools',
  'content',
  'fileTree',
  'filePreview',
] as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        settings: enSettings,
        chat: enChat,
        sidebar: enSidebar,
        tools: enTools,
        content: enContent,
        fileTree: enFileTree,
        filePreview: enFilePreview,
      },
      de: {
        common: deCommon,
        settings: deSettings,
        chat: deChat,
        sidebar: deSidebar,
        tools: deTools,
      },
    },
    ns: [...NAMESPACES],
    defaultNS: 'common',
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES.map((language) => language.code),
    // Collapse region variants ("de-AT") to the base language ("de").
    load: 'languageOnly',
    interpolation: {
      // React already escapes interpolated values.
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
    },
  });

export default i18n;
