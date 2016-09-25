import assign from 'object-assign';

const STORAGE_KEY = 'soap4me-settings';

const quality = {
	SD: 'sd',
	HD: 'hd',
	FULLHD: 'fullhd',
};

const translation = {
	LOCALIZATION: 'localization',
	SUBTITLES: 'subtitles',
};

const playback = {
	CONTINUES: 'continues',
	BY_EPISODE: 'by_episode',
};

export const params = {
	VIDEO_QUALITY: 'video-quality',
	TRANSLATION: 'translation',
	VIDEO_PLAYBACK: 'video-playback',
};

export const values = {
	[params.VIDEO_QUALITY]: quality,
	[params.TRANSLATION]: translation,
	[params.VIDEO_PLAYBACK]: playback,
};

const defaults = {
	[params.VIDEO_QUALITY]: quality.FULLHD,
	[params.TRANSLATION]: translation.LOCALIZATION,
	[params.VIDEO_PLAYBACK]: playback.CONTINUES,
};

const settings = getSettingsFromStorage(defaults);

export function set(key, value) {
	let hasParam = checkKeyValidity(key);
	let hasValue = checkKeyValueValidity(key, value);

	if (!hasParam) throw new Error(`Unsupported settings param "${key}"`);
	if (!hasValue) throw new Error(`Unsupported value "${value}" for settings param "${key}"`);

	settings[key] = value;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function get(key) {
	return settings[key];
}

export function getAll() {
	return assign({}, settings);
}

function getSettingsFromStorage(defaults = {}) {
	let settings = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
	let validatedSettings = Object
		.keys(settings)
		.filter(checkKeyValidity)
		.map(key => ({key, value: settings[key]}))
		.filter(({key, value}) => checkKeyValueValidity(key, value))
		.reduce((result, {key, value}) => {
			result[key] = value;
			return result;
		}, {});

	return assign({}, defaults, validatedSettings);
}

function checkKeyValidity(key) {
	return Object
		.keys(params)
		.some(param => params[param] === key);
}

function checkKeyValueValidity(key, value) {
	if (!checkKeyValidity(key)) return false;

	return Object
		.keys(values[key])
		.some(param => values[key][param] === value);
}
