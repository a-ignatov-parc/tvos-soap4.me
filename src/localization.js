/* global Settings */

import moment from 'moment';

// Loading extra locales
import 'moment/locale/ru';

import EventBus from './event-bus';
import * as settings from './settings';

import English from './localization/en';
import Russian from './localization/ru';

const bus = new EventBus();

const { LANGUAGE } = settings.params;
const { AUTO, EN, RU } = settings.values[LANGUAGE];

const translations = {
  default: English,
  [EN]: English,
  [RU]: Russian,
};

export function getSystemLanguage() {
  return Settings.language;
}

export function getLanguage() {
  if (settings.get(LANGUAGE) === AUTO) {
    return getSystemLanguage();
  }
  return settings.get(LANGUAGE);
}

// Configuring initial locale.
moment.locale(getLanguage());

settings
  .subscription()
  .pipe(({ key }) => {
    if (key === LANGUAGE) {
      const language = getLanguage();

      // Updating locale
      moment.locale(language);
      bus.broadcast({ language });
    }
  });

export const subscription = bus.subscription.bind(bus);

export function get(name, params = {}) {
  const translation = translations[getLanguage()] || translations.default;
  const key = translation[name];

  if (typeof key === 'function') {
    return key(params);
  }

  return key || name;
}

export function getSystemCountryCode() {
  return Settings.storefrontCountryCode;
}
