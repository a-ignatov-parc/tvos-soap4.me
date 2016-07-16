export const quality = {
	SD: 'SD',
	HD: '720p',
	FULLHD: '720p',
};

export const qualityPreferences = [
	quality.FULLHD,
	quality.HD,
	quality.SD,
];

export function getDefault(episode) {
	return qualityPreferences.reduce((result, quality) => {
		if (!result && episode[quality]) return episode[quality];
		return result;
	}, null);
}
