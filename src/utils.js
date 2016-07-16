import {navigate} from 'tvdml';

export function log(message = '') {
	return (payload) => {
		console.log(message, payload);
		return payload;
	}
}

export function link(route, params) {
	return event => navigate(route, params);
}

export function getStartParams() {
	return JSON.parse(sessionStorage.getItem('startParams') || '{}');
}

export function noop() {
	return () => {};
}

export function fixSpecialSymbols(text) {
	return text.replace('&#039;', `'`);
}
