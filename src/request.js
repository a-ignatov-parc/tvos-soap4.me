import {Promise} from 'tvdml';
import assign from 'object-assign';

const GET = 'GET';
const POST = 'POST';

export function get(url, params = {}) {
	return request(url, assign({method: GET}, params));
}

export function post(url, data, params = {}) {
	return request(url, assign({method: POST, data}, params));
}

export function toString() {
	return ({responseText}) => responseText;
}

export function toJSON() {
	let stringify = toString();
	return xhr => JSON.parse(stringify(xhr));
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
				XHR.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
			}

			return XHR;
		})
		.then(prepare)
		.then(XHR => new Promise((resolve, reject) => {
			XHR.addEventListener('load', result(resolve));
			XHR.addEventListener('error', result(reject));
			XHR.addEventListener('abort', result(reject));
			XHR.addEventListener('timeout', result(reject));

			if (typeof(progress) === 'function') {
				XHR.addEventListener('progress', (event) => {
					if (event.lengthComputable) {
						progress(event.loaded / event.total);
					}
				});
			}

			XHR.send(JSON.stringify(data));
		}))
		.then((xhr) => {
			const {status} = xhr;

			if (status >= 200 && status < 300 || status === 304) {
				return xhr;
			}
			return Promise.reject(xhr);
		});
}

function result(handler) {
	return ({target}) => handler(target);
}
