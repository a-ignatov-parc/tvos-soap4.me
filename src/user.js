/* global localStorage */

import EventBus from './event-bus';

const bus = new EventBus();

const STORAGE_KEY = 'soap4me-user';

const cache = {
  payload: JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'),
};

const contract = [
  'till',
  'token',
  'logged',
  'family',
  'selected',
];

export const subscription = bus.subscription.bind(bus);

export function set(payload) {
  cache.payload = Object
    .keys(payload)
    .reduce((result, key) => {
      if (~contract.indexOf(key)) {
        if (typeof payload[key] !== 'undefined') {
          // eslint-disable-next-line no-param-reassign
          result[key] = payload[key];
        }
      } else {
        console.warn(`Passed unsupported key "${key}". Skipping...`);
      }
      return result;
    }, cache.payload);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(cache.payload));
  bus.broadcast(cache.payload);
  return cache.payload;
}

export function get() {
  return cache.payload;
}

export function clear() {
  cache.payload = {};
  localStorage.removeItem(STORAGE_KEY);
  bus.broadcast(cache.payload);
}

export function getToken() {
  return get().token;
}

export function getMainAccount() {
  const [mainAccount] = (get().family || []).slice(0).sort(({
    main: a,
  }, {
    main: b,
  }) => b - a);
  return mainAccount;
}

export function getLogin() {
  return (get().selected || getMainAccount() || {}).name;
}

export function isExtended() {
  return Date.now() / 1000 < get().till;
}

export function isAuthorized() {
  return get().logged > 0;
}

export function isFamily() {
  return get().selected != null;
}
