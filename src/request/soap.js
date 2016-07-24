import * as token from '../token';
import * as request from '../request/native';

export function get(url) {
	return request.get(url, headers());
}

export function post(url, parameters) {
	return request.post(url, parameters, headers());
}

function headers() {
	return {
		'X-Api-Token': token.get(),
		'User-Agent': 'xbmc for soap',
	};
}
