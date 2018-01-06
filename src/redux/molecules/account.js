/* global localStorage */

import curry from 'curry';

import { checkSession } from '../../api/client';

import stateReducer from '../reduce';
import createMolecule from '../molecule';

import { isEventWithName } from '../utils';

import {
  DATA_ERROR,
  DATA_LOADED,
  DATA_PENDING,
} from '../constants';

const UPDATE = Symbol('account/update');
const ERROR = Symbol('account/error');

const TOKEN_STORAGE_KEY = 'soap4atv-user-token';

const isAppStartedEvent = curry(isEventWithName)('appStarted');

const defaultState = {
  meta: { status: DATA_PENDING },
  token: localStorage.getItem(TOKEN_STORAGE_KEY),
  activeUserId: undefined,
  till: undefined,
  extended: false,
  logged: false,
  family: false,
};

function updateAccount(payload) {
  return { type: UPDATE, data: payload };
}

function handleError(error) {
  return { type: ERROR, meta: { error } };
}

const reducer = stateReducer(defaultState, {
  [UPDATE]: (state, { data }) => {
    const {
      token,
      logged,
    } = data;

    const meta = {
      status: DATA_LOADED,
    };

    console.log(444, data);

    if (logged > 0) {
      return {
        meta,
        token,
        logged: true,
      };
    }

    return {
      meta,
      token,
      till: null,
      logged: false,
      family: false,
      extended: false,
      activeUserId: null,
    };
  },
});

const middleware = store => next => action => {
  if (isAppStartedEvent(action)) {
    checkSession()
      .then(response => store.dispatch(updateAccount(response)))
      .catch(error => store.dispatch(handleError(error)));
  }

  if (action.type === UPDATE && action.data.token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, action.data.token);
  }

  return next(action);
};

export default createMolecule({ reducer, middleware });
