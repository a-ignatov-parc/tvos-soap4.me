import {Promise} from 'tvdml';

export function get(url, headers = {}) {
	return new Promise((resolve) => {
		const cId = `get${Date.now()}`;
		requests[cId] = response => {
			delete requests[cId];
			resolve(response);
		}
		nativeGET(cId, url, headers);
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
