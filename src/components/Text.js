import PropTypes from 'prop-types';

import pure from 'recompose/pure';
import compose from 'recompose/compose';

import withLang from '../hocs/withLang';

import i18n from '../i18n';

function Text(props) {
  const {
    lang,
    i18n: key,
    ...payload,
  } = props;

  return i18n(lang, key, payload);
}

Text.propTypes = {
  lang: PropTypes.string.isRequired,
  i18n: PropTypes.string.isRequired,
};

export default compose(
  withLang,
  pure,
)(Text);
