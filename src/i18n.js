export default function i18n(lang, key, payload) {
  const localizationStrings = require(`./i18n/${lang}`).default;
  const value = localizationStrings[key] || key;
  const result = typeof value === 'function' ? value(payload) : value;
  return result;
}
