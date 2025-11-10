import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      appTitle: 'Finance Plus ERP',
      welcome: 'Welcome back, {{name}}',
      dashboard: 'Dashboard',
      settings: 'Settings',
      users: 'Users',
      currencySettings: 'Currency Settings',
      mobileMoney: 'Mobile Money',
      zimraCompliance: 'ZIMRA Compliance',
    },
  },
  sn: {
    translation: {
      appTitle: 'Finance Plus ERP',
      welcome: 'Mauya zvakare, {{name}}',
      dashboard: 'Dheshibhodhi',
      settings: 'Zvirongwa',
      users: 'Vashandisi',
      currencySettings: 'Marongero eMari',
      mobileMoney: 'Mobile Money',
      zimraCompliance: 'Kutevedza ZIMRA',
    },
  },
  nd: {
    translation: {
      appTitle: 'Finance Plus ERP',
      welcome: 'Siyakwamukela futhi, {{name}}',
      dashboard: 'Ibhodi',
      settings: 'Izilungiselelo',
      users: 'Abasebenzisi',
      currencySettings: 'Izilungiselelo Zemali',
      mobileMoney: 'Mobile Money',
      zimraCompliance: 'Ukulandela ZIMRA',
    },
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n; 