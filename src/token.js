const TOKEN = 'soap4me-token';
const EXPIRES = 'soap4me-token-expires';

export function set(token, expires) {
	localStorage.setItem(TOKEN, token);
	localStorage.setItem(EXPIRES, (`${expires}000`).slice(0, 13));
}

export function get() {
	let token = localStorage.getItem(TOKEN);
	let expires = localStorage.getItem(EXPIRES);

	if (Date.now() < expires) {
		return token;
	}

	remove();
	return null;
}

export function remove() {
	localStorage.removeItem(TOKEN);
	localStorage.removeItem(EXPIRES);
}
