import assign from 'object-assign';

import * as token from '../token';
import * as request from '../request';

const headers = {
	'User-Agent': 'xbmc for soap',
};

export function get(url) {
	return request.get(url, assign({'X-Api-Token': token.get()}, headers));
}

export function post(url, parameters) {
	return request.post(url, parameters, assign({'X-Api-Token': token.get()}, headers));
}
