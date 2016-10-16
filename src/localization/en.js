export default {
	'auth-checking': 'Checking authorization...',

	'menu-my': 'My',
	'menu-all': 'TV Shows',
	'menu-search': 'Search',
	'menu-settings': 'Settings',

	'settings-caption': 'Settings',

	'settings-logout-caption': 'Are you sure you want to log out?',
	'settings-logout-logout_btn': 'Logout',
	'settings-logout-cancel_btn': 'Cancel',

	'settings-titles-account': 'Account',
	'settings-titles-network': 'Network',
	'settings-titles-about': 'About',

	'settings-labels-video_quality': 'Video quality',
	'settings-labels-translation': 'Translation',
	'settings-labels-video_playback': 'Video playback',
	'settings-labels-language': 'Interface language',
	'settings-labels-login': 'Login',
	'settings-labels-logout': 'Logout',
	'settings-labels-speedtest': 'Speed test',
	'settings-labels-version': 'Version',

	'settings-descriptions-video_quality': 'Prefered video quality that will be used if available.',
	'settings-descriptions-translation': 'To be able to use subtitles special option must be activated in account preferences on soap4.me site. Until this will be done only localized episodes will be shown.',
	'settings-descriptions-video_playback': 'Configure player playback mode. Should it play all episodes in season or just one.',

	'settings-values-sd': 'SD',
	'settings-values-hd': 'HD',
	'settings-values-fhd': 'Full HD',
	'settings-values-subtitles': 'Subtitles priority',
	'settings-values-localization': 'Localization priority',
	'settings-values-continues': 'Continues',
	'settings-values-by_episode': 'By episode',
	'settings-values-auto': 'System language',
	'settings-values-en': 'English',
	'settings-values-ru': 'Русский',

	'tvshow-title': ({title}) => title,
	'tvshow-title-from-episode': ({soap_en}) => soap_en,
	'tvshow-episode-title': ({title_en}) => title_en,
	'tvshow-season': ({seasonNumber}) => `Season ${seasonNumber}`,

	'new-episode-soon': 'Soon',
	'new-episode-day': 'Episode in a day',
	'new-episode-custom-date': ({date}) => `Episode ${date}`,

	'my-caption': 'My',

	'my-closed': 'Closed',
	'my-watched': 'Watched',
	'my-new-episodes': 'New episodes',

	'all-caption': 'TV Shows',

	'all-group-by': 'Group by',
	'all-group-by-title': ({title}) => `Group by ${title}`,

	'all-group-title-name': 'Name',
	'all-group-name-title': 'A — Z',

	'all-group-title-date': 'Date',

	'all-group-title-likes': 'Likes',
	'all-group-likes-title-over-thousand': ({thousand}) => `Over ${thousand}k`,
	'all-group-likes-title-over-hundred': ({hundred}) => `Over ${hundred}`,
	'all-group-likes-title-lower-hundred': ({hundred}) => `Lower ${hundred}`,

	'all-group-title-rating': 'Rating',

	'all-group-title-completeness': 'Completeness',
	'all-group-completeness-title': 'Completed',

	'search-latest': 'Latest TV Shows',
	'search-popular': 'Popular TV Shows',
	'search-persons': 'Persons',
	'search-actor': 'Actor',
	'search-tvshows': 'TV Shows',
};
