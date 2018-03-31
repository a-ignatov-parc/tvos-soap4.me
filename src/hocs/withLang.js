import { connect } from 'react-redux';

import {
  LANGUAGE_EN,
  LANGUAGE_RU,
  LANGUAGE_SYSTEM,
} from '../redux/molecules/settings';

export default connect(state => {
  const { language } = state.settings;
  const { systemLanguage } = state.device;

  let lang = systemLanguage;

  if (language === LANGUAGE_RU) lang = 'ru';
  if (language === LANGUAGE_EN) lang = 'en';

  return {
    lang,
  };
});
