import assign from 'object-assign';

import * as settings from './settings';
import {getDefault} from './quality';

const {TRANSLATION} = settings.params;
const {ANY, RUSSIAN, SUBTITLES} = settings.values[TRANSLATION];

export function getSeasonEpisodes({
	episodes: episodesList = [],
	subtitles: subtitlesList = [],
}) {
	let translationSettings = settings.get(TRANSLATION);

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
}
