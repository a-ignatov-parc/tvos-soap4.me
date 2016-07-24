import {get as getToken} from '../token';
import * as request from '../request/native';

export function get(url) {
	return request.get(url, headers());
}

export function post(url, parameters) {
	return request.post(url, parameters, headers());
}

function headers() {
	let token = getToken();
	let headers = {
		'User-Agent': 'xbmc for soap',
	};

	if (token) {
		headers['X-Api-Token'] = token;
	}

	return headers;
}
