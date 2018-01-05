import * as request from '../request';

import store from '../redux/store';

function emptyOrErrorsResolvers(defaults) {
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
  console.log(111, store.getState());

  return {};

  /*const token = getToken();
  const name = `soap4atv${isQello() ? '-qello' : ''}`;
  const userAgent = `ATV: ${name} ${version}`;

  return {
    'X-Api-Token': token,
    'X-User-Agent': userAgent,
    'User-Agent': userAgent,
  };*/
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