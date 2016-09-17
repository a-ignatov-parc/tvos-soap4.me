import md5 from 'blueimp-md5';
import assign from 'object-assign';

import {getToken} from '../user';
import * as settings from '../settings';
import * as request from '../request/native';

const {VIDEO_QUALITY, TRANSLATION} = settings.params;
const {SD, HD, FULLHD} = settings.values[VIDEO_QUALITY];
const {LOCALIZATION, SUBTITLES} = settings.values[TRANSLATION];

export const tvshow = {
	ENDED: 'ended',
	CLOSED: 'closed',
	RUNNING: 'running',
};

export const localization = {
	ORIGINAL: 'original',
	ORIGINAL_SUBTITLES: 'original_subtitles',
	LOCALIZATION: 'localization',
	LOCALIZATION_SUBTITLES: 'localization_subtitles',
};

export const mediaQualities = {
	1: SD,
	2: HD,
	3: FULLHD,
};

export const mediaQualityRanking = [
	FULLHD,
	HD,
	SD,
];

export const mediaLocalizationRanking = {
	[LOCALIZATION]: [
		localization.LOCALIZATION,
		localization.LOCALIZATION_SUBTITLES,
		localization.ORIGINAL_SUBTITLES,
		localization.ORIGINAL,
	],

	[SUBTITLES]: [
		localization.ORIGINAL_SUBTITLES,
		localization.LOCALIZATION_SUBTITLES,
		localization.LOCALIZATION,
		localization.ORIGINAL,
	],
};

export const mediaLocalizations = {
	1: localization.ORIGINAL,
	2: localization.ORIGINAL_SUBTITLES,
	3: localization.LOCALIZATION_SUBTITLES,
	4: localization.LOCALIZATION,
};

export const mediaLocalizationStrings = {
	[localization.ORIGINAL]: 'Original',
	[localization.ORIGINAL_SUBTITLES]: 'Original with subtitles',
	[localization.LOCALIZATION]: 'Localization',
	[localization.LOCALIZATION_SUBTITLES]: 'Localization with subtitles',
};

export const TVShowStatuses = {
	0: tvshow.RUNNING,
	1: tvshow.ENDED,
	2: tvshow.CLOSED,
};

export const TVShowStatusStrings = {
	[tvshow.ENDED]: 'Ended',
	[tvshow.CLOSED]: 'Closed',
	[tvshow.RUNNING]: 'Running',
};

export function get(url) {
	return request.get(url, headers()).then(response => {
		console.log('GET', url, response);
		return response;
	});
}

export function post(url, parameters) {
	return request.post(url, parameters, headers()).then(response => {
		console.log('POST', url, parameters, response);
		return response;
	});
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

export function getLatestTVShows(count = 10) {
	return getAllTVShows().then(tvshows => {
		return tvshows
			.sort(({sid: a}, {sid: b}) => b - a)
			.slice(0, count);
	});
}

export function getPopularTVShows(count = 10) {
	return getAllTVShows().then(tvshows => {
		return tvshows
			.sort(({likes: a}, {likes: b}) => b - a)
			.slice(0, count);
	});
}

export function getTVShowDescription(sid) {
	return get(`https://api.soap4.me/v2/soap/description/${sid}/`);
}

export function getCountriesList() {
	return get(`https://api.soap4.me/v2/soap/countrys/`);
}

export function getTVShowEpisodes(sid) {
	return get(`https://api.soap4.me/v2/episodes/${sid}/`);
}

export function getTVShowRecommendations(sid) {
	return get(`https://api.soap4.me/v2/soap/recommendations/${sid}/`);
}

export function getTVShowReviews(sid) {
	return get(`https://api.soap4.me/v2/reviews/${sid}/`).then(handleEmptyResponse);
}

export function getTVShowTrailers(sid) {
	return get(`https://api.soap4.me/v2/trailers/${sid}/`).then(handleEmptyResponse);
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

export function getEpisodeMedia({files = []}) {
	let qualitySettings = settings.get(VIDEO_QUALITY);
	let translationSettings = settings.get(TRANSLATION);

	let qualityRanking = mediaQualityRanking.slice(mediaQualityRanking.indexOf(qualitySettings));
	let localizationRanking = mediaLocalizationRanking[translationSettings];

	let [rankedFile] = files
		.slice(0)
		.sort(({
			quality: qualityA,
			translate: translateA,
		}, {
			quality: qualityB,
			translate: translateB,
		}) => {
			let qualityIndexA = resolveCodeToIndex(mediaQualities[qualityA], qualityRanking);
			let qualityIndexB = resolveCodeToIndex(mediaQualities[qualityB], qualityRanking);
			let localizationIndexA = resolveCodeToIndex(mediaLocalizations[translateA], localizationRanking);
			let localizationIndexB = resolveCodeToIndex(mediaLocalizations[translateB], localizationRanking);
			return (qualityIndexA - qualityIndexB) + (localizationIndexA - localizationIndexB);
		});

	return rankedFile;
}

export function markEpisodeAsWatched(sid, season, episodeNumber) {
	return post(`https://api.soap4.me/v2/episodes/watch/${sid}/${season}/${episodeNumber}/`);
}

export function markEpisodeAsUnWatched(sid, season, episodeNumber) {
	return post(`https://api.soap4.me/v2/episodes/unwatch/${sid}/${season}/${episodeNumber}/`);
}

export function getMediaStream(media) {
	let {sid, file} = media;
	let {eid, hash: episodeHash} = file;

	let token = getToken();
	let hash = md5(token + eid + sid + episodeHash);

	return post(`https://api.soap4.me/v2/play/episode/${eid}/`, {eid, hash});
}

export function getTrailerStream(tid) {
	return post(`https://api.soap4.me/v2/play/trailer/${tid}/`);
}

export function addToMyTVShows(sid) {
	return post(`https://api.soap4.me/v2/soap/watch/${sid}/`);
}

export function removeFromMyTVShows(sid) {
	return post(`https://api.soap4.me/v2/soap/unwatch/${sid}/`);
}

export function getSearchResults(query) {
	return get(`https://api.soap4.me/v2/search/?q=${encodeURIComponent(query)}`);
}

export function saveElapsedTime(eid, time) {
	return post(`https://api.soap4.me/v2/play/episode/${eid}/savets/`, {eid, time});
}

export function getSpeedTestServers() {
	return get('https://api.soap4.me/v2/speedtest/servers/');
}

export function saveSpeedTestResults(results) {
	return post('https://api.soap4.me/v2/speedtest/save/', results);
}

function headers() {
	let token = getToken();
	let userAgent = 'ATV: soap4.me v1.0.0';

	return {
		'X-Api-Token': token,
		'X-User-Agent': userAgent,
		'User-Agent': userAgent,
	};
}

function handleEmptyResponse(response) {
	if ('ok' in response && !response.ok) return [];
	return response;
}

function resolveCodeToIndex(code, collection = []) {
	let index = collection.indexOf(code);
	return index < 0 ? collection.length : index;
}
