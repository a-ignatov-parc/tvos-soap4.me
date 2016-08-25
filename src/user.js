const STORAGE_KEY = 'soap4me-user';

const cache = {};

const contract = [
	'till',
	'token',
	'logged',
];

export function set(payload) {
	cache.payload = Object
		.keys(payload)
		.reduce((result, key) => {
			if (~contract.indexOf(key)) {
				result[key] = payload[key];
			} else {
				console.warn(`Passed unsupported key "${key}". Skipping...`);
			}
			return result;
		}, {});

	localStorage.setItem(STORAGE_KEY, JSON.stringify(cache.payload));
	return cache.payload;
}

export function get() {
	if (cache.payload) return cache.payload;
	return cache.payload = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
}

export function clear() {
	delete cache.payload;
	localStorage.removeItem(STORAGE_KEY);
}

export function getToken() {
	return get().token;
}

export function isExtended() {
	return Date.now() / 1000 < get().till;
}

export function isAuthorized() {
	return get().logged > 0;
}
