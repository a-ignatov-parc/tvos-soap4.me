import {Promise} from 'tvdml';

const GET = 'GET';
const POST = 'POST';

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

export function get(url, prepare) {
	return request(url, {
		method: GET,
		prepare,
	});
}

export function post(url, data, prepare) {
	return request(url, {
		method: POST,
		prepare,
		data,
	});
}

export function nativeAuthorization(login, password) {
	return new Promise((resolve) => {
		const callbackId = `authorization${Date.now()}`;
		requests[callbackId] = resolve;
		authorize(login, password, callbackId);
	});
}

function result(handler) {
	return ({target}) => handler(target);
}
