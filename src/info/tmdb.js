import {get, toJSON} from '../request';
import {hours} from '../utils';

const cache = {};
const timeouts = {};

const REQUEST_TTL = hours(1);

const API_BASE_URL = 'https://api.themoviedb.org';
const API_KEY = 'd272326e467344029e68e3c4ff0b4059';
const PHOTO_SIZE_PARAM = 'w500';

export function invalidateCache(query) {
	timeouts[query] && clearTimeout(timeouts[query]);
	delete cache[query];
}

export function search(query) {
	if (cache[query]) {
		return cache[query];
	}

	let resourceUrl = `${API_BASE_URL}/3/search/multi`;
	let requestUrl = `${resourceUrl}?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;

	return cache[query] = get(requestUrl)
		.then(toJSON())
		.then(({results}) => results)
		.then(response => {
			timeouts[query] = setTimeout(() => invalidateCache(query), REQUEST_TTL);
			return response;
		})
		.catch((error) => {
			invalidateCache(query);
			return Promise.reject(error);
		});
}

export function getActor(actorName) {
	return search(actorName).then(result => {
		return result.filter(({media_type}) => media_type === 'person')[0];
	});
}

export function getActorPhoto({profile_path}) {
	return `https://image.tmdb.org/t/p/${PHOTO_SIZE_PARAM}${profile_path}`;
}
