import * as request from '../request';

import store from '../redux/store';

function emptyOrErrors(defaults) {
  return [
    // eslint-disable-next-line no-confusing-arrow
    response => response != null ? response : defaults,
    () => defaults,
  ];
}

function resolveCodeToIndex(code, collection = []) {
  const index = collection.indexOf(code);
  return index < 0 ? collection.length : index;
}

function requestLogger(...params) {
  return [
    response => {
      console.info(...params, response);
      return response;
    },

    xhr => {
      console.error(...params, xhr.status, xhr);
      return Promise.reject(xhr);
    },
  ];
}

function headers() {
  const { app, account } = store.getState();

  const { token } = account;
  const { isQello, version } = app;

  const name = `soap4atv${isQello ? '-qello' : ''}`;
  const userAgent = `ATV: ${name} v${version}`;

  return {
    'X-Api-Token': token,
    'X-User-Agent': userAgent,
    'User-Agent': userAgent,
  };
}

function addHeaders(dict) {
  return XHR => {
    Object.keys(dict).forEach(key => XHR.setRequestHeader(key, dict[key]));
    return XHR;
  };
}

export function get(url) {
  return request
    .get(url, { prepare: addHeaders(headers()) })
    .then(request.toJSON())
    .then(...requestLogger('GET', url));
}

export function post(url, parameters) {
  return request
    .post(url, parameters, { prepare: addHeaders(headers()) })
    .then(request.toJSON())
    .then(...requestLogger('POST', url, parameters));
}

export function checkSession() {
  return get('https://api.soap4.me/v2/auth/check/');
}

export function authorize({ login, password }) {
  return post('https://api.soap4.me/v2/auth/', { login, password })
    .catch(xhr => {
      if (xhr.status === 403) {
        return request.toJSON()(xhr);
      }
      return Promise.reject(xhr);
    });
}

export function logout() {
  return post('https://api.soap4.me/v2/auth/logout/');
}

export function getAllTVShows() {
  return get('https://api.soap4.me/v2/soap/');
}

export function getMyTVShows() {
  return get('https://api.soap4.me/v2/soap/my/').then(...emptyOrErrors([]));
}

export function getCountriesList() {
  return get('https://api.soap4.me/v2/soap/countrys/');
}

export function getGenresList() {
  return get('https://api.soap4.me/v2/soap/genres/');
}
