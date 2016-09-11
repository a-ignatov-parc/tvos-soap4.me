import md5 from 'blueimp-md5';
import assign from 'object-assign';

import {getToken} from '../user';
import * as request from '../request/native';

import * as settings from '../settings';
import {getDefault} from '../quality';

const {TRANSLATION} = settings.params;
const {ANY, RUSSIAN, SUBTITLES} = settings.values[TRANSLATION];

export const TVShowStatuses = {
	0: 'Running',
	1: 'Ended',
	2: 'Closed',
};

export function get(url) {
	return request.get(url, headers()).then(response => {
		console.log(url, response);
		return response;
	});
}

export function post(url, parameters) {
	return request.post(url, parameters, headers());
}

export function checkSession() {
	return get('https://api.soap4.me/v2/auth/check/');
}

export function authorize({login, password}) {
	return post('https://api.soap4.me/v2/auth/', {login, password});
}

export function logout() {
	return post('https://api.soap4.me/v2/auth/logout/');
}

export function getMyTVShows() {
	return get('https://api.soap4.me/v2/soap/my/');
}

export function getAllTVShows() {
	return get('https://api.soap4.me/v2/soap/');
}

export function getTVShowDescription(sid) {
	return get(`https://api.soap4.me/v2/soap/description/${sid}/`);
}

export function getTVShowEpisodes(sid) {
	return get(`https://api.soap4.me/v2/episodes/${sid}/`);
}

export function getTVShowRecommendations(sid) {
	return get(`https://api.soap4.me/v2/soap/recommendations/${sid}/`);
}

export function getTVShowReviews(sid) {
	return get(`https://api.soap4.me/v2/reviews/${sid}/`);
}

export function getTVShowSeasons(sid) {
	return getTVShowEpisodes(sid)
		.then(({covers, episodes}) => {
			return episodes.reduce((result, episode) => {
				if (!result[episode.season]) {
					result[episode.season] = {
						episodes: [],
						unwatched: 0,
						season: episode.season,
						covers: covers.filter(({season}) => season === episode.season)[0],
					};
				}
				result[episode.season].episodes.push(episode);
				episode.watched || result[episode.season].unwatched++;
				return result;
			}, {});
		})
		.then(seasonsCollection => {
			return Object
				.keys(seasonsCollection)
				.sort((a, b) => a - b)
				.map(seasonNumber => seasonsCollection[seasonNumber])
				.map(season => assign({}, season, {episodes: season.episodes.slice(0).sort((a, b) => a.episode - b.episode)}));
		});
}

export function getTVShowSeason(sid, id) {
	return getTVShowSeasons(sid).then(seasons => seasons.filter(season => season.season === id)[0]);
}

export function getActorInfo(id) {
	return get(`https://api.soap4.me/v2/soap/person/${id}/`);
}

/*export function getTVShow(sid) {
	return getAllTVShows().then(series => {
		let tvshow = null;

		series.some(item => {
			if (item.sid === sid) {
				tvshow = item;
				return true;
			}
		});

		return tvshow;
	});
}

export function getTVShowEpisodes(sid) {
	return get(`https://soap4.me/api/episodes/${sid}/`);
}

export function getTVShowSeasons(sid) {
	return getTVShowEpisodes(sid).then(episodes => episodes.reduce((result, item) => {
		let seasonIndex = item.season - 1;
		let episodeIndex = item.episode;

		if (!result[seasonIndex]) {
			result[seasonIndex] = {
				id: item.season_id,
				season: item.season,
				episodes: [],
				subtitles: [],
			};
		}

		let episodeCollection = result[seasonIndex].episodes;

		if (~item.translate.toLowerCase().indexOf('субтитры')) {
			episodeCollection = result[seasonIndex].subtitles;
		}

		if (!episodeCollection[episodeIndex]) {
			episodeCollection[episodeIndex] = {};
		}
		episodeCollection[episodeIndex][item.quality] = item;
		return result;
	}, []));
}

export function getTVShowSeason(sid, id) {
	return getTVShowSeasons(sid).then(seasons => seasons.filter(season => season.id === id)[0]);
}

export function getResolvedSeasonEpisodes(season) {
	let translationSettings = settings.get(TRANSLATION);
	let {
		episodes: episodesList = [],
		subtitles: subtitlesList = [],
	} = season;

	let episodes = episodesList
		.filter(Boolean)
		.map(getDefault);

	let subtitles = subtitlesList
		.filter(Boolean)
		.map(getDefault)
		.map((episode, i) => assign({}, episode, {
			hasSubtitles: true,
		}));

	let episodesIds = episodes.map(({episode}) => episode);

	if (translationSettings === RUSSIAN || !subtitles.length) {
		return episodes;
	} else if (translationSettings === SUBTITLES) {
		return subtitles;
	} else if (translationSettings === ANY) {
		return subtitles.map(episode => {
			let {episode: id} = episode;
			let episodesIndex = episodesIds.indexOf(id);
			return ~episodesIndex ? episodes[episodesIndex] : episode;
		});
	}
	return [];
}*/

export function markEpisodeAsWatched(eid) {
	let token = getToken();
	let payload = {
		eid,
		token,
		what: 'mark_watched',
	};

	return post('https://soap4.me/callback/', payload);
}

export function markEpisodeAsUnWatched(eid) {
	let token = getToken();
	let payload = {
		eid,
		token,
		what: 'mark_unwatched',
	};

	return post('https://soap4.me/callback/', payload);
}

export function getEpisodeMediaURL(eid, sid, episodeHash) {
	let token = getToken();
	let hash = md5(token + eid + sid + episodeHash);
	let payload = {
		eid,
		hash,
		token,
		do: 'load',
		what: 'player',
	};

	return post('https://soap4.me/callback/', payload).then(({server}) => {
		return `https://${server}.soap4.me/${token}/${eid}/${hash}/`;
	});
}

export function addToMyTVShows(sid) {
	let token = getToken();
	return post(`https://soap4.me/api/soap/watch/${sid}/`, {token});
}

export function removeFromMyTVShows(sid) {
	let token = getToken();
	return post(`https://soap4.me/api/soap/unwatch/${sid}/`, {token});
}

export function getSearchResults(query) {
	return get(`https://soap4.me/api/search/?q=${encodeURIComponent(query)}`);
}

function headers() {
	let token = getToken();
	let headers = {
		'X-Api-Token': token,
		'User-Agent': 'ATV: soap4.me v1.0.0',
	};

	return headers;
}
