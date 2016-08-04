import {get as getToken} from '../token';
import * as request from '../request/native';

export function get(url) {
	return request.get(url, headers());
}

export function post(url, parameters) {
	return request.post(url, parameters, headers());
}

export function markEpisodeAsWatched(eid) {
	let token = getToken();
	let payload = {
		eid,
		token,
		what: 'mark_watched',
	};

	return post('https://soap4.me/callback/', payload);
}

export function markEpisodeAsUnWatched(eid) {
	let token = getToken();
	let payload = {
		eid,
		token,
		what: 'mark_unwatched',
	};

	return post('https://soap4.me/callback/', payload);
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
