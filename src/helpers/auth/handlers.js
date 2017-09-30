import * as TVDML from 'tvdml';

import { get as i18n } from '../../localization';

// eslint-disable-next-line import/prefer-default-export
export function defaultErrorHandlers(error) {
  this.reset().then(payload => {
    const messageCode = error.code === 'EBADCREDENTIALS'
      ? 'login-error-wrong-login'
      : 'login-error-something-went-wrong';

    const promise = TVDML.renderModal((
      <document>
        <alertTemplate>
          <title>
            {i18n(messageCode)}
          </title>
          <button onSelect={TVDML.removeModal}>
            <text>Ok</text>
          </button>
        </alertTemplate>
      </document>
    ));

    return promise.sink(payload);
  });
}
