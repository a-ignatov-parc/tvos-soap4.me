/* global localStorage */

import {
  logout,
  authorize,
  checkSession,
} from '../../api/client';

import stateReducer from '../reduce';
import createMolecule from '../molecule';

import {
  DATA_ERROR,
  DATA_LOADED,
  DATA_PENDING,
} from '../constants';

const LOGOUT = Symbol('tvshows/logout');
const AUTHORIZE = Symbol('tvshows/authorize');
const CHECK_SESSION = Symbol('tvshows/check_session');

const RESOLVE = Symbol('account/resolve');

const TOKEN_STORAGE_KEY = 'soap4atv-user-token';

const defaultState = {
  token: localStorage.getItem(TOKEN_STORAGE_KEY),
  till: undefined,
  login: undefined,
  extended: false,
  logged: false,
  authStatus: DATA_PENDING,
  fetchStatus: DATA_PENDING,
};

export function checkAuthorization() {
  return { type: CHECK_SESSION };
}

export function deleteAuthorization() {
  return { type: LOGOUT };
}

export function authorizeWithCredentials(login, password) {
  return { type: AUTHORIZE, data: { login, password } };
}

const reducer = stateReducer(defaultState, {
  [LOGOUT]: () => ({
    authStatus: DATA_PENDING,
  }),

  [AUTHORIZE]: () => ({
    authStatus: DATA_PENDING,
  }),

  [CHECK_SESSION]: () => ({
    authStatus: DATA_PENDING,
    fetchStatus: DATA_PENDING,
  }),

  [RESOLVE]: (state, { data, meta }) => {
    const {
      till,
      login,
      token,
      logged,
    } = data;

    const { action } = meta;

    console.log(444, data, action);

    if (action.type === LOGOUT) {
      return {
        ...defaultState,
        token: undefined,
        authStatus: DATA_LOADED,
        fetchStatus: DATA_LOADED,
      };
    }

    if (logged > 0 || action.type === AUTHORIZE) {
      return {
        ...token && { token },
        till,
        login,
        logged: true,
        extended: Date.now() / 1000 < till,
        authStatus: DATA_LOADED,
        fetchStatus: DATA_LOADED,
      };
    }

    return {
      ...token && { token },
      till: null,
      login: null,
      logged: false,
      extended: false,
      authStatus: DATA_LOADED,
      fetchStatus: DATA_LOADED,
    };
  },
});

const middleware = store => next => action => {
  const result = next(action);

  if (action.type === CHECK_SESSION) {
    checkSession().then(response => store.dispatch({
      type: RESOLVE,
      data: response,
      meta: { action },
    }));
  }

  if (action.type === AUTHORIZE) {
    authorize(action.data).then(response => store.dispatch({
      type: RESOLVE,
      data: response,
      meta: { action },
    }));
  }

  if (action.type === LOGOUT) {
    logout().then(response => store.dispatch({
      type: RESOLVE,
      data: response,
      meta: { action },
    }));
  }

  if (action.type === RESOLVE) {
    if (action.data.token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, action.data.token);
    } else if (action.meta.action.type === LOGOUT) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }

  return result;
};

export default createMolecule({ reducer, middleware });
