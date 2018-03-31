import * as TVDML from 'tvdml';

import compose from 'recompose/compose';
import withState from 'recompose/withState';

import { renderModalWithRuntime } from '../utils';

import withAccount from '../hocs/withAccount';

import Text from '../components/Text';
import Loader from '../components/Loader';

import Form from './Auth/Form';

function onInputSelect(setInput, params) {
  const pipeline = renderModalWithRuntime(() => (
    <Form
      {...params}
      onSubmit={value => setInput(value, TVDML.removeModal)}
    />
  ));

  pipeline.sink();
}

function Auth(props) {
  const {
    login,
    password,
    setLogin,
    setPassword,
    account,
    authorizingAccount,
    deleteAuthorization,
    authorizeWithCredentials,
  } = props;

  const hasLogin = !!login;
  const hasPassword = !!password;

  if (authorizingAccount) {
    return (
      <Loader />
    );
  }

  if (account.logged) {
    return (
      <document>
        <descriptiveAlertTemplate>
          <title>
            <Text i18n='authorize-caption' />
          </title>
          <button onSelect={() => deleteAuthorization()}>
            <text>
              <Text i18n='user-logout-button' />
            </text>
          </button>
        </descriptiveAlertTemplate>
      </document>
    );
  }

  return (
    <document>
      <head>
        <style>{`
          .input {
            width: 500;
            background-color: rgba(51, 51, 51, 0.2);
          }

          @media tv-template and (tv-theme:dark) {
            .input {
              background-color: rgba(204, 204, 204, 0.2);
            }
          }

          .empty-input-text {
            color: rgba(255, 255, 255, 0.5);
            tv-highlight-color: rgba(0, 0, 0, 0.5);
          }
        `}</style>
      </head>
      <descriptiveAlertTemplate>
        <title>
          <Text i18n='authorize-caption' />
        </title>
        <button
          class='input'
          onSelect={onInputSelect.bind(this, setLogin, {
            title: <Text i18n='authorize-login-title' />,
            description: <Text i18n='authorize-login-description' />,
            placeholder: <Text i18n='authorize-login-placeholder' />,
          })}
        >
          <text class={hasLogin ? undefined : 'empty-input-text'}>
            {hasLogin ? login : 'Login'}
          </text>
        </button>
        <button
          class='input'
          onSelect={onInputSelect.bind(this, setPassword, {
            title: <Text i18n='authorize-password-title' />,
            description: <Text i18n='authorize-password-description' />,
            placeholder: <Text i18n='authorize-password-placeholder' />,
            validate: value => value.length > 5,
            secure: true,
          })}
        >
          <text class={hasPassword ? undefined : 'empty-input-text'}>
            {hasPassword ? password.replace(/./g, '•') : 'Password'}
          </text>
        </button>
        <button
          style={{ margin: '50 0 0' }}
          disabled={!hasLogin || !hasPassword}
          onSelect={() => authorizeWithCredentials(login, password)}
        >
          <text>
            <Text i18n='authorize-control-trigger' />
          </text>
        </button>
      </descriptiveAlertTemplate>
    </document>
  );
}

export default compose(
  withState('login', 'setLogin', ''),
  withState('password', 'setPassword', ''),
  withAccount,
)(Auth);
