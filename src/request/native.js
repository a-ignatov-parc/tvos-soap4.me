import {Promise} from 'tvdml';
import {minutes} from '../utils';

let uid = 0;

const cache = {};
const timeouts = {};

const REQUEST_TTL = minutes(0);

export function invalidateCache(url) {
	timeouts[url] && clearTimeout(timeouts[url]);
	delete cache[url];
}

export function get(url, headers = {}) {
	if (cache[url]) {
		return cache[url];
	}

	return cache[url] = new Promise((resolve) => {
		const cId = `get${getUID()}`;
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
		const cId = `post${getUID()}`;
		requests[cId] = response => {
			delete requests[cId];
			resolve(response);
		}
		nativePOST(cId, url, parameters, headers);
	});
}

function getUID() {
	return ++uid;
}
