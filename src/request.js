import {Promise} from 'tvdml';

const cache = {};
const timeouts = {};

const GET = 'GET';
const POST = 'POST';

const REQUEST_TTL = min(10);

export function invalidateCache(url) {
	timeouts[url] && clearTimeout(timeouts[url]);
	delete cache[url];
}

export function get(url, headers = {}) {
	if (cache[url]) {
		return cache[url];
	}

	return cache[url] = new Promise((resolve) => {
		const cId = `get${Date.now()}`;
		requests[cId] = response => {
			delete requests[cId];
			resolve(response);
		}
		nativeGET(cId, url, headers);
	})
	.then(response => {
		timeouts[url] = setTimeout(() => invalidateCache(url), REQUEST_TTL);
		return response;
	})
	.catch((error) => {
		invalidateCache(url);
		return Promise.reject(error);
	});
}

export function post(url, parameters = {}, headers = {}) {
	return new Promise((resolve) => {
		const cId = `post${Date.now()}`;
		requests[cId] = response => {
			delete requests[cId];
			resolve(response);
		}
		nativePOST(cId, url, parameters, headers);
	});
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

function min(amount) {
	return amount * 60 * 1000;
}
