import {navigate} from 'tvdml';
import {request} from './request';

const parser = new DOMParser();

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
