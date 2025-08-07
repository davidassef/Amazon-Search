import i18next from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import en from './locales/en.json';
import pt from './locales/pt.json';
import es from './locales/es.json';

// Initialize i18next
i18next
  .use(LanguageDetector)
  .init({
    resources: {
      en: { translation: en },
      pt: { translation: pt },
      es: { translation: es }
    },
    lng: localStorage.getItem('selectedLanguage') || 'en',
    fallbackLng: 'en',
    debug: false,
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false
    }
  })
  .then(() => {
    // Set global reference
    window.i18next = i18next;
    
    // Dispatch custom event to notify main.js that i18next is ready
    const event = new CustomEvent('i18nextInitialized', {
      detail: { i18next: i18next }
    });
    document.dispatchEvent(event);
    
    console.log('i18next initialized successfully');
  })
  .catch((err) => {
    console.error('i18next initialization failed:', err);
  });

export default i18next;
