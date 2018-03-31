/* global Device */

import stateReducer from '../reduce';
import createMolecule from '../molecule';

const CHANGE_QUALITY = Symbol('settings/change_quality');
const CHANGE_LANGUAGE = Symbol('settings/change_language');
const CHANGE_PLAYBACK = Symbol('settings/change_playback');
const CHANGE_TRANSLATION = Symbol('settings/change_translation');

const SETTINGS_STORAGE_KEY = 'soap4atv-settings';

export const LANGUAGE_EN = 'language/en';
export const LANGUAGE_RU = 'language/ru';
export const LANGUAGE_SYSTEM = 'language/system';

export const QUALITY_SD = 'quality/sd';
export const QUALITY_HD = 'quality/hd';
export const QUALITY_FHD = 'quality/fhd';
export const QUALITY_UHD = 'quality/uhd';

export const PLAYBACK_CONTINUES = 'playback/continues';
export const PLAYBACK_BY_EPISODE = 'playback/by_episode';

export const TRANSLATION_SUBTITLES = 'translation/subtitles';
export const TRANSLATION_LOCALIZATION = 'translation/localization';

const defaultState = {
  quality: QUALITY_FHD,
  language: LANGUAGE_SYSTEM,
  playback: PLAYBACK_CONTINUES,
  translation: TRANSLATION_LOCALIZATION,
  ...JSON.parse(localStorage.getItem(SETTINGS_STORAGE_KEY) || '{}'),
};

export function setLanguageToEN() {
  return { type: CHANGE_LANGUAGE, data: LANGUAGE_EN };
}

export function setLanguageToRU() {
  return { type: CHANGE_LANGUAGE, data: LANGUAGE_RU };
}

export function setLanguageToSystem() {
  return { type: CHANGE_LANGUAGE, data: LANGUAGE_SYSTEM };
}

const reducer = stateReducer(defaultState, {
  [CHANGE_QUALITY]: (state, { data }) => ({ quality: data }),
  [CHANGE_LANGUAGE]: (state, { data }) => ({ language: data }),
  [CHANGE_PLAYBACK]: (state, { data }) => ({ playback: data }),
  [CHANGE_TRANSLATION]: (state, { data }) => ({ translation: data }),
});

const allowedActions = [
  CHANGE_QUALITY,
  CHANGE_LANGUAGE,
  CHANGE_PLAYBACK,
  CHANGE_TRANSLATION,
];

const middleware = store => next => action => {
  const result = next(action);

  if (allowedActions.includes(action.type)) {
    const settings = store.getState().settings;
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  }

  return result;
};

export default createMolecule({ reducer, middleware });
