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

export function fixSpecialSymbols(text = '') {
	return text.replace(/&#039;/g, `'`);
}

export function capitalize(word) {
	word = `${word}`;
	return word.charAt(0).toUpperCase() + word.slice(1);
}

export function capitalizeText(text) {
	return `${text}`.split(' ').map(capitalize).join(' ');
}

export function seconds(amount) {
	return amount * 1000;
}

export function minutes(amount) {
	return seconds(amount) * 60;
}

export function hours(amount) {
	return minutes(amount) * 60;
}
