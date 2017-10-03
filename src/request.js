/* global XMLHttpRequest */

import { Promise } from 'tvdml';

const GET = 'GET';
const POST = 'POST';

function result(handler) {
  return ({ target }) => handler(target);
}

export function request(url, params = {}) {
  const {
    data = {},
    method = GET,
    prepare = payload => payload,
    progress,
  } = params;

  return Promise
    .resolve(new XMLHttpRequest())
    .then(XHR => {
      XHR.open(method, url);

      if (method === POST) {
        // eslint-disable-next-line max-len
        XHR.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
      }

      return XHR;
    })
    .then(prepare)
    .then(XHR => new Promise((resolve, reject) => {
      XHR.addEventListener('load', result(resolve));
      XHR.addEventListener('error', result(reject));
      XHR.addEventListener('abort', result(reject));
      XHR.addEventListener('timeout', result(reject));

      if (typeof progress === 'function') {
        XHR.addEventListener('progress', event => {
          if (event.lengthComputable) {
            progress(event.loaded / event.total);
          }
        });
      }

      const requestBody = Object
        .keys(data)
        .reduce((list, key) => {
          list.push(`${key}=${encodeURIComponent(data[key])}`);
          return list;
        }, [])
        .join('&');

      XHR.send(requestBody);
    }))
    .then(xhr => {
      const { status } = xhr;

      // eslint-disable-next-line no-mixed-operators
      if (status >= 200 && status < 300 || status === 304) {
        return xhr;
      }
      return Promise.reject(xhr);
    });
}

export function get(url, params = {}) {
  return request(url, {
    method: GET,
    ...params,
  });
}

export function post(url, data, params = {}) {
  return request(url, {
    method: POST,
    data,
    ...params,
  });
}

export function toString() {
  return ({ responseText }) => responseText;
}

export function toJSON() {
  const stringify = toString();
  return xhr => JSON.parse(stringify(xhr));
}
