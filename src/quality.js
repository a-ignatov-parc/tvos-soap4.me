import * as settings from './settings';

const {VIDEO_QUALITY} = settings.params;
const {SD, HD, FULLHD} = settings.values[VIDEO_QUALITY];

export const qualityMapping = {
	[SD]: 'SD',
	[HD]: '720p',
	[FULLHD]: '720p',
};

export const qualityPreferences = [
	FULLHD,
	HD,
	SD,
];

export function getDefault(episode) {
	return qualityPreferences
		.slice(qualityPreferences.indexOf(settings.get(VIDEO_QUALITY)))
		.map(key => qualityMapping[key])
		.reduce((result, quality) => {
			if (!result && episode[quality]) return episode[quality];
			return result;
		}, null);
}
