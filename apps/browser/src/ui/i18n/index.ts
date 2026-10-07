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
import enCommandCenter from './locales/en/commandCenter.json';
import enUi from './locales/en/ui.json';
import enWorkspace from './locales/en/workspace.json';
import deCommon from './locales/de/common.json';
import deSettings from './locales/de/settings.json';
import deChat from './locales/de/chat.json';
import deSidebar from './locales/de/sidebar.json';
import deTools from './locales/de/tools.json';
import deContent from './locales/de/content.json';
import deFileTree from './locales/de/fileTree.json';
import deFilePreview from './locales/de/filePreview.json';
import deCommandCenter from './locales/de/commandCenter.json';
import deUi from './locales/de/ui.json';
import deWorkspace from './locales/de/workspace.json';
import frCommon from './locales/fr/common.json';
import frSettings from './locales/fr/settings.json';
import frChat from './locales/fr/chat.json';
import frSidebar from './locales/fr/sidebar.json';
import frTools from './locales/fr/tools.json';
import frContent from './locales/fr/content.json';
import frFileTree from './locales/fr/fileTree.json';
import frFilePreview from './locales/fr/filePreview.json';
import frCommandCenter from './locales/fr/commandCenter.json';
import frUi from './locales/fr/ui.json';
import frWorkspace from './locales/fr/workspace.json';
import esCommon from './locales/es/common.json';
import esSettings from './locales/es/settings.json';
import esChat from './locales/es/chat.json';
import esSidebar from './locales/es/sidebar.json';
import esTools from './locales/es/tools.json';
import esContent from './locales/es/content.json';
import esFileTree from './locales/es/fileTree.json';
import esFilePreview from './locales/es/filePreview.json';
import esCommandCenter from './locales/es/commandCenter.json';
import esUi from './locales/es/ui.json';
import esWorkspace from './locales/es/workspace.json';
import ruCommon from './locales/ru/common.json';
import ruSettings from './locales/ru/settings.json';
import ruChat from './locales/ru/chat.json';
import ruSidebar from './locales/ru/sidebar.json';
import ruTools from './locales/ru/tools.json';
import ruContent from './locales/ru/content.json';
import ruFileTree from './locales/ru/fileTree.json';
import ruFilePreview from './locales/ru/filePreview.json';
import ruCommandCenter from './locales/ru/commandCenter.json';
import ruUi from './locales/ru/ui.json';
import ruWorkspace from './locales/ru/workspace.json';
import zhCommon from './locales/zh/common.json';
import zhSettings from './locales/zh/settings.json';
import zhChat from './locales/zh/chat.json';
import zhSidebar from './locales/zh/sidebar.json';
import zhTools from './locales/zh/tools.json';
import zhContent from './locales/zh/content.json';
import zhFileTree from './locales/zh/fileTree.json';
import zhFilePreview from './locales/zh/filePreview.json';
import zhCommandCenter from './locales/zh/commandCenter.json';
import zhUi from './locales/zh/ui.json';
import zhWorkspace from './locales/zh/workspace.json';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'de', label: 'Deutsch' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'ru', label: 'Русский' },
  { code: 'zh', label: '中文' },
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
  'commandCenter',
  'ui',
  'workspace',
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
        commandCenter: enCommandCenter,
        ui: enUi,
        workspace: enWorkspace,
      },
      de: {
        common: deCommon,
        settings: deSettings,
        chat: deChat,
        sidebar: deSidebar,
        tools: deTools,
        content: deContent,
        fileTree: deFileTree,
        filePreview: deFilePreview,
        commandCenter: deCommandCenter,
        ui: deUi,
        workspace: deWorkspace,
      },
      fr: {
        common: frCommon,
        settings: frSettings,
        chat: frChat,
        sidebar: frSidebar,
        tools: frTools,
        content: frContent,
        fileTree: frFileTree,
        filePreview: frFilePreview,
        commandCenter: frCommandCenter,
        ui: frUi,
        workspace: frWorkspace,
      },
      es: {
        common: esCommon,
        settings: esSettings,
        chat: esChat,
        sidebar: esSidebar,
        tools: esTools,
        content: esContent,
        fileTree: esFileTree,
        filePreview: esFilePreview,
        commandCenter: esCommandCenter,
        ui: esUi,
        workspace: esWorkspace,
      },
      ru: {
        common: ruCommon,
        settings: ruSettings,
        chat: ruChat,
        sidebar: ruSidebar,
        tools: ruTools,
        content: ruContent,
        fileTree: ruFileTree,
        filePreview: ruFilePreview,
        commandCenter: ruCommandCenter,
        ui: ruUi,
        workspace: ruWorkspace,
      },
      zh: {
        common: zhCommon,
        settings: zhSettings,
        chat: zhChat,
        sidebar: zhSidebar,
        tools: zhTools,
        content: zhContent,
        fileTree: zhFileTree,
        filePreview: zhFilePreview,
        commandCenter: zhCommandCenter,
        ui: zhUi,
        workspace: zhWorkspace,
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
