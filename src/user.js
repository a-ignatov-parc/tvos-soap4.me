import * as TVDML from 'tvdml';

const STORAGE_KEY = 'soap4me-user';

const subscriptions = [];
const cache = {
	payload: JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'),
};

const contract = [
	'till',
	'login',
	'token',
	'logged',
];

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
		broadcast();
	}

	return cache.payload;
}

export function get() {
	return cache.payload;
}

export function clear() {
	cache.payload = {};
	localStorage.removeItem(STORAGE_KEY);
	broadcast();
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

export function subscription() {
	let pipeline = TVDML.createPassThroughPipeline({
		extend: {
			unsubscribe() {
				let index = subscriptions.indexOf(pipeline);

				if (~index) {
					subscriptions.splice(index, 1);
				}
			}
		}
	});

	subscriptions.push(pipeline);

	return pipeline;
}

function broadcast() {
	subscriptions.forEach(pipeline => pipeline.sink(cache));
}
