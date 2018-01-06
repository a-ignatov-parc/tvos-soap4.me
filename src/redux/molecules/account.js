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

const RESOLVE = Symbol('account/resolve');
const ERROR = Symbol('account/error');

const TOKEN_STORAGE_KEY = 'soap4atv-user-token';

const isAppStartedEvent = curry(isEventWithName)('appStarted');

const defaultState = {
  token: localStorage.getItem(TOKEN_STORAGE_KEY),
  till: undefined,
  extended: false,
  logged: false,
  fetchStatus: DATA_PENDING,
};

function resolveResponse(response) {
  return { type: RESOLVE, data: response };
}

function handleError(error) {
  return { type: ERROR, meta: { error } };
}

const reducer = stateReducer(defaultState, {
  [RESOLVE]: (state, { data }) => {
    const {
      token,
      logged,
    } = data;

    console.log(444, data);

    if (logged > 0) {
      return {
        token,
        logged: true,
        fetchStatus: DATA_LOADED,
      };
    }

    return {
      token,
      till: null,
      logged: false,
      extended: false,
      fetchStatus: DATA_LOADED,
    };
  },
});

const middleware = store => next => action => {
  if (isAppStartedEvent(action)) {
    checkSession()
      .then(response => store.dispatch(resolveResponse(response)))
      .catch(error => store.dispatch(handleError(error)));
  }

  if (action.type === RESOLVE && action.data.token) {
    localStorage.setItem(TOKEN_STORAGE_KEY, action.data.token);
  }

  return next(action);
};

export default createMolecule({ reducer, middleware });
