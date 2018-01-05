/* global Device */

import stateReducer from '../reduce';
import createMolecule from '../molecule';

import { TYPE_EVENT } from '../constants';

const LAUNCH = Symbol('app/launch');
const RESUME = Symbol('app/resume');
const SUSPEND = Symbol('app/suspend');

const ACTIVE = 'active';
const STARTING = 'starting';
const SUSPENDED = 'suspended';

const defaultState = {
  status: STARTING,
  baseUrl: undefined,
  initParams: undefined,
  version: process.env.APP_VERSION,
  isQello: !!~Device.appIdentifier.toLowerCase().indexOf('qello'),
};

export function launchApp(params) {
  return { type: LAUNCH, data: params };
}

export function suspendApp() {
  return { type: SUSPEND };
}

export function resumeApp() {
  return { type: RESUME };
}

const reducer = stateReducer(defaultState, {
  [LAUNCH]: (state, { data }) => ({
    status: ACTIVE,
    initParams: data,
    baseUrl: state.isQello
      ? 'https://a-ignatov-parc.github.io/tvos-soap4.me-releases/qello/tvml/'
      : data.BASEURL,
  }),
  [RESUME]: () => ({ status: ACTIVE }),
  [SUSPEND]: () => ({ status: SUSPENDED }),
});

const middleware = store => next => action => {
  const result = next(action);

  if (action.type === LAUNCH) {
    store.dispatch({
      type: TYPE_EVENT,
      meta: { name: 'appStarted' },
    });
  }

  return result;
};

export default createMolecule({ reducer, middleware });
