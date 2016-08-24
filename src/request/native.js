import {Promise} from 'tvdml';

let uid = 0;

export function get(url, headers = {}) {
	return new Promise((resolve) => {
		const cId = `get${getUID()}`;
		requests[cId] = response => {
			delete requests[cId];
			resolve(response);
		}
		nativeGET(cId, url, headers);
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
