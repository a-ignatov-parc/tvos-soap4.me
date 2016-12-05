import EventBus from './event-bus';

const bus = new EventBus();

const STORAGE_KEY = 'soap4me-user';

const cache = {
	payload: JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'),
};

const contract = [
	'till',
	'login',
	'token',
	'logged',
	'family',
	'selected',
];

export const subscription = bus.subscription.bind(bus);

export function set(payload) {
	let prevState = isAuthorized();

	cache.payload = Object
		.keys(payload)
		.reduce((result, key) => {
			if (~contract.indexOf(key)) {
				if (payload[key] != null) {
					result[key] = payload[key];
				}
			} else {
				console.warn(`Passed unsupported key "${key}". Skipping...`);
			}
			return result;
		}, cache.payload);

	localStorage.setItem(STORAGE_KEY, JSON.stringify(cache.payload));

	if (prevState !== isAuthorized()) {
		bus.broadcast(cache);
	}

	return cache.payload;
}

export function get() {
	return cache.payload;
}

export function clear() {
	cache.payload = {};
	localStorage.removeItem(STORAGE_KEY);
	bus.broadcast(cache);
}

export function getToken() {
	return get().token;
}

export function getLogin() {
	return get().login;
}

export function isExtended() {
	return Date.now() / 1000 < get().till;
}

export function isAuthorized() {
	return get().logged > 0;
}
