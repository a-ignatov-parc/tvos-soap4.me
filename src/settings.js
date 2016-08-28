import assign from 'object-assign';

const STORAGE_KEY = 'soap4me-settings';

const quality = {
	SD: 'sd',
	HD: 'hd',
	FULLHD: 'fullhd',
};

const translation = {
	ANY: 'any',
	RUSSIAN: 'russian',
	SUBTITLES: 'subtitles',
};

export const params = {
	VIDEO_QUALITY: 'video-quality',
	TRANSLATION: 'translation',
};

export const values = {
	[params.VIDEO_QUALITY]: quality,
	[params.TRANSLATION]: translation,
};

const defaults = {
	[params.VIDEO_QUALITY]: quality.FULLHD,
	[params.TRANSLATION]: translation.ANY,
};

const settings = getSettingsFromStorage(defaults);

export function set(key, value) {
	let hasParam = Object
		.keys(params)
		.some(param => params[param] === key);

	if (!hasParam) throw new Error(`Unsupported settings param "${key}"`);

	let hasValue = Object
		.keys(values[key])
		.some(param => values[key][param] === value);

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
	return assign({}, defaults, settings);
}
