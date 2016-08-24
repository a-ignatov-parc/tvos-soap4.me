import {navigate} from 'tvdml';

export function isMenuButtonPressNavigatedTo(targetDocument) {
	return ({to: {document}}) => {
		let {menuBarDocument} = document;

		if (menuBarDocument) {
			document = menuBarDocument.getDocument(menuBarDocument.getSelectedItem());
		}

		return targetDocument === document;
	}
}

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

export function prettifyEpisodeNum(season = 0, episode = 0) {
	return `s${prettifyNum(season)}e${prettifyNum(episode)}`;
}

export function prettifyNum(num, ordinal = 2) {
	return `${Math.pow(10, ordinal)}${num}`.slice(-ordinal);
}
