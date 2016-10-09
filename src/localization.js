import EventBus from './event-bus';
import * as settings from './settings';

import English from './localization/en';
import Russian from './localization/ru';

const bus = new EventBus();

const {LANGUAGE} = settings.params;
const {AUTO, EN, RU} = settings.values[LANGUAGE];

const translations = {
	'default': English,
	[EN]: English,
	[RU]: Russian,
};

settings
	.subscription()
	.pipe(({key}) => {
		if (key === LANGUAGE) {
			bus.broadcast({language: getLanguage()});
		}
	});

export const subscription = bus.subscription.bind(bus);

export function get(name, params = {}) {
	let translation = translations[getLanguage()] || translations.default;
	let key = translation[name];

	if (typeof(key) === 'function') {
		return key(params);
	}

	return key;
}

export function getSystemCountryCode() {
	return Settings.storefrontCountryCode;
}

export function getSystemLanguage() {
	return Settings.language;
}

export function getLanguage() {
	if (settings.get(LANGUAGE) === AUTO) {
		return getSystemLanguage();
	}
	return settings.get(LANGUAGE);
}
