/* global navigationDocument */

import * as TVDML from 'tvdml';

import { authorize } from '../request/soap';
import { get as i18n } from '../localization';
import { noop, getStartParams, removeDocumentFromNavigation } from '../utils';

import Loader from '../components/loader';

import logo from '../assets/logo.png';

const IDLE = 'idle';
const LOGIN = 'login';
const PASSWORD = 'password';
const AUTHORIZING = 'authorizing';

let uid = 0;

function defaultValidate(value) {
  return !!value;
}

function getUID() {
  uid += 1;
  return uid;
}

function getLoginRouteName(id) {
  return `login-${id}`;
}

function getPasswordRouteName(id) {
  return `password-${id}`;
}

function getAuthorizingRouteName(id) {
  return `authorizing-${id}`;
}

function createForm(params = {}) {
  const {
    onSubmit = noop(),
    validate: customValidate = defaultValidate,
  } = params;

  return TVDML.render(
    TVDML.createComponent({
      getInitialState() {
        return {
          value: '',
          placeholder: '',
          valid: false,
          button: 'Submit',
          ...params,
        };
      },

      componentDidMount() {
        const keyboard = this.textField.getFeature('Keyboard');
        keyboard.onTextChange = () => this.validate(keyboard.text);
      },

      validate(value) {
        this.setState({
          value,
          valid: customValidate(value),
        });
      },

      render() {
        const { BASEURL } = getStartParams();

        return (
          <document>
            <formTemplate>
              <banner>
                <img src={BASEURL + logo} width="218" height="218" />
                <description>{this.state.description}</description>
              </banner>
              <textField
                secure={this.state.secure}
                ref={node => (this.textField = node)}
              >
                {this.state.placeholder}
              </textField>
              <footer>
                <button onSelect={this.onSubmit} disabled={!this.state.valid}>
                  <text>{this.state.button}</text>
                </button>
              </footer>
            </formTemplate>
          </document>
        );
      },

      onSubmit() {
        onSubmit(this.state.value);
      },
    }),
  );
}

export default function auth(options = {}) {
  const id = `auth-${getUID()}`;
  const envelope = {
    login: '',
    password: '',
  };

  const { onError = noop(), onSuccess = noop() } = options;

  let menuButtonPressStream = null;
  let state = IDLE;

  const routesList = [
    getLoginRouteName(id),
    getPasswordRouteName(id),
    getAuthorizingRouteName(id),
  ];

  const instance = {
    id,

    present() {
      if (state === IDLE) {
        menuButtonPressStream = TVDML.subscribe('menu-button-press');
        menuButtonPressStream.pipe(payload => {
          const {
            from: { modal, route: routeFrom },
            to: { route: routeTo },
          } = payload;

          if (routeFrom === getLoginRouteName(id) && !modal) {
            const error = new Error('User aborted login process');
            error.code = 'EABORT';
            onError.call(instance, error);
            this.dismiss();
          }

          if (routeTo === getLoginRouteName(id)) {
            envelope.password = '';
            state = LOGIN;
          }

          if (routeTo === getPasswordRouteName(id)) {
            if (envelope.reject) envelope.reject();
            state = PASSWORD;
          }
        });

        return TVDML.navigate(getLoginRouteName(id));
      }

      const error = new Error(`Incorrect state: "${state}"`);
      error.code = 'EINCORECTSTATE';
      throw error;
    },

    reset() {
      if (state !== IDLE) {
        return TVDML.navigate(getLoginRouteName(id));
      }

      const error = new Error(`Incorrect state: "${state}"`);
      error.code = 'EINCORECTSTATE';
      throw error;
    },

    dismiss() {
      state = IDLE;

      if (menuButtonPressStream) {
        menuButtonPressStream.unsubscribe();
        menuButtonPressStream = null;
      }

      navigationDocument.documents
        .filter(({ route }) => ~routesList.indexOf(route))
        .forEach(removeDocumentFromNavigation);
    },

    destroy() {
      TVDML.dismissRoute(getLoginRouteName(id));
      TVDML.dismissRoute(getPasswordRouteName(id));
      TVDML.dismissRoute(getAuthorizingRouteName(id));
    },
  };

  TVDML.handleRoute(getLoginRouteName(id))
    .pipe(
      TVDML.passthrough(() => {
        state = LOGIN;
        return state;
      }),
    )
    .pipe(
      createForm({
        description: i18n('login-step1-caption'),
        placeholder: i18n('login-step1-placeholder'),
        button: i18n('login-step1-button'),

        onSubmit(login) {
          envelope.login = login;
          TVDML.navigate(getPasswordRouteName(id));
        },
      }),
    )
    .pipe(({ document }) => {
      let target = document.prevRouteDocument;

      while (target && ~routesList.indexOf(target.route)) {
        removeDocumentFromNavigation(target);
        target = target.prevRouteDocument;
      }
    });

  TVDML.handleRoute(getPasswordRouteName(id))
    .pipe(TVDML.passthrough(() => (state = PASSWORD)))
    .pipe(TVDML.render(<Loader />))
    .pipe(
      createForm({
        description: i18n('login-step2-caption'),
        placeholder: i18n('login-step2-placeholder'),
        button: i18n('login-step2-button'),
        secure: true,

        validate(value) {
          return value.length > 5;
        },

        onSubmit(password) {
          envelope.password = password;
          TVDML.navigate(getAuthorizingRouteName(id));
        },
      }),
    );

  TVDML.handleRoute(getAuthorizingRouteName(id))
    .pipe(TVDML.passthrough(() => (state = AUTHORIZING)))
    .pipe(TVDML.render(<Loader title={i18n('login-step3-caption')} />))
    .pipe(() => {
      const promise = new Promise((resolve, reject) => {
        const { login, password } = envelope;

        envelope.reject = reject;
        authorize({ login, password }).then(resolve, reject);
      });

      return promise
        .then(response => {
          const { ok, sid, ...details } = response;
          if (ok) {
            onSuccess.call(instance, { ...details, logged: 1 });
          } else {
            const error = new Error('Wrong login or password');
            error.code = 'EBADCREDENTIALS';
            onError.call(instance, error);
          }
        })
        .catch(error => onError.call(instance, error));
    });

  return instance;
}
