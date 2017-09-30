import * as TVDML from 'tvdml';

import {get as i18n} from '../../localization';

export function defaultErrorHandlers(error) {
  if (error.code === 'EBADCREDENTIALS') {
    this.reset().then(payload => TVDML.renderModal(
      <document>
        <alertTemplate>
          <title>
            {i18n('login-error-wrong-login')}
          </title>
          <button onSelect={TVDML.removeModal}>
            <text>Ok</text>
          </button>
        </alertTemplate>
      </document>
    )
    .sink(payload));
  }

  if (error.code === 'EBADRESPONSE') {
    this.reset().then(payload => TVDML.renderModal(
      <document>
        <alertTemplate>
          <title>
            {i18n('login-error-something-went-wrong')}
          </title>
          <button onSelect={TVDML.removeModal}>
            <text>Ok</text>
          </button>
        </alertTemplate>
      </document>
    )
    .sink(payload));
  }
}
