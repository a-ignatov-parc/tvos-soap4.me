/* eslint camelcase: "off" */

import { supportUHD } from '../request/soap';
import { pluralSuffix } from '../utils';

export default {
  'auth-checking': 'Checking authorization...',

  'menu-my': 'My',
  'menu-tvshows': 'Shows',
  'menu-movies': 'Movies',
  'menu-search': '🔍',
  'menu-account': 'Account',
  'menu-settings': 'Settings',

  'user-caption': 'Account',
  'user-description': ({ till }) => `Extended account expires ${till}`,

  'user-account-active': 'Active',
  'user-turn-on-family-account-button': 'Turn On Family Account',
  'user-turn-on-family-account-title':
    'Are you sure you want to turn on Family Account?',
  'user-turn-on-family-account-action_button': 'Turn On',
  'user-turn-off-family-account-button': 'Turn Off Family Account',
  'user-turn-off-family-account-title':
    'Are you sure you want to turn off Family Account?',
  'user-turn-off-family-account-action_button': 'Turn Off',
  'user-switch-family-account-cancel_button': 'Cancel',

  'user-add-account-button': 'Add new account',
  'user-add-account-form-title': 'Account creation',
  'user-add-account-form-description': 'Enter name for new account.',
  'user-add-account-form-button': 'Add',

  'user-action-menu-title': ({ name }) => `What you want to do with "${name}"?`,
  'user-action-set-as-active-button': 'Set as Active',
  'user-action-rename-button': 'Rename',
  'user-action-delete-button': 'Delete',

  'user-rename-account-form-title': ({ name }) => `Rename account "${name}"`,
  'user-rename-account-form-description': 'Enter new name for the account.',
  'user-rename-account-form-button': 'Update',

  'user-logout-button': 'Logout',
  'user-logout-caption': 'Are you sure you want to log out?',
  'user-logout-logout_button': 'Logout',
  'user-logout-cancel_button': 'Cancel',

  'settings-caption': 'Settings',

  'settings-titles-network': 'Network',
  'settings-titles-about': 'About',

  'settings-labels-video_quality': 'Video quality',
  'settings-labels-translation': 'Translation',
  'settings-labels-video_playback': 'Video playback',
  'settings-labels-language': 'Interface language',
  'settings-labels-speedtest': 'Speed test',
  'settings-labels-version': 'Version',

  'settings-descriptions-video_quality': () =>
    `Prefered video quality that will be used if available.\n4K (UHD) video is${
      supportUHD ? ' ' : ' not '
    }supported on this device.`,
  'settings-descriptions-translation':
    'To be able to use subtitles special option must be activated in account preferences on soap4.me site. Until this will be done only localized episodes will be shown.',
  'settings-descriptions-video_playback':
    'Configure player playback mode. Should it play all episodes in season or just one.',

  'settings-values-sd': 'SD',
  'settings-values-hd': 'HD',
  'settings-values-fhd': 'Full HD',
  'settings-values-uhd': '4K (UHD)',
  'settings-values-subtitles': 'Subtitles priority',
  'settings-values-localization': 'Localization priority',
  'settings-values-continues': 'Continues',
  'settings-values-by_episode': 'By episode',
  'settings-values-auto': 'System language',
  'settings-values-en': 'English',
  'settings-values-ru': 'Русский',

  'speedtest-caption': 'Speed test',
  'speedtest-loading': 'Loading servers info...',
  'speedtest-begin': 'Begin test',
  'speedtest-testing': 'Testing download speed...',
  'speedtest-footnote':
    'You must wait until the test is over otherwise the results will not be applicable',
  'speedtest-error-title': 'Something went wrong =(',
  'speedtest-error-description':
    'Please check your internet connection and try again',

  'speedtest-result': ({ speed }) => `${speed} Mb/s`,
  'speedtest-result-too-slow': 'Too slow. Skipped...',

  'speedtest-country-fr': 'France',
  'speedtest-country-de': 'Germany',
  'speedtest-country-nl': 'Netherlands',
  'speedtest-country-ru': 'Russian Federation',
  'speedtest-country-lt': 'Lithuania',
  'speedtest-country-by': 'Belarus',
  'speedtest-country-ca': 'Canada',
  'speedtest-country-es': 'Spain',
  'speedtest-country-gb': 'United Kingdom',
  'speedtest-country-it': 'Italy',
  'speedtest-country-se': 'Sweden',
  'speedtest-country-sg': 'Singapore',
  'speedtest-country-us': 'United States',
  'speedtest-country-il': 'Israel',
  'speedtest-country-md': 'Moldova',
  'speedtest-country-pl': 'Poland',
  'speedtest-country-at': 'Austria',
  'speedtest-country-bg': 'Bulgaria',
  'speedtest-country-cz': 'Czech Republic',

  'episode-more': 'More',
  'episode-mark-as-watched': 'Mark as Watched',
  'episode-mark-as-unwatched': 'Mark as Unwatched',
  'episode-speedtest': 'Speed test',
  'episode-rate': 'Rate episode',
  'episode-rate-title': ({ timeout }) =>
    `Rate episode${timeout ? ` or wait ${timeout} sec.` : ''}`,

  'season-title-more': 'More',
  'season-mark-as-watched': 'Mark Season as Watched',
  'season-mark-as-unwatched': 'Mark Season as Unwatched',

  'tvshow-title': ({ title_en, title }) => title_en || title || '',
  'tvshow-title-from-episode': ({ soap_en }) => soap_en || '',
  'tvshow-episode-title': ({ title_en }) => title_en || '',
  'tvshow-episode-airdate': ({ airdate }) => `Airdate ${airdate}`,
  'tvshow-episode-menu-hint': "press and hold to open episode's menu",
  'tvshow-season': ({ seasonNumber }) => `Season ${seasonNumber}`,

  'tvshow-status': 'Status',
  'tvshow-genres': 'Genres',
  'tvshow-actors': 'Actors',
  'tvshow-seasons': 'Seasons',
  'tvshow-also-watched': 'Viewers Also Watched',
  'tvshow-ratings': 'Ratings and Reviews',
  'tvshow-cast-crew': 'Cast and Crew',
  'movie-cast-crew-role': ({ role }) =>
    ({
      director: 'Director',
      writer: 'Writer',
      actor: 'Actor',
    }[role] || ''),

  'tvshow-information': 'Information',
  'tvshow-information-year': 'Year',
  'tvshow-information-runtime': 'Runtime',
  'tvshow-information-country': 'Country',
  'tvshow-information-network': 'Network',

  'tvshow-languages': 'Languages',
  'tvshow-languages-primary': 'Primary',
  'tvshow-languages-primary-values': 'Russian, English',

  'tvshow-title-more': 'More',
  'tvshow-mark-as-watched': 'Mark TV Show as Watched',
  'tvshow-mark-as-unwatched': 'Mark TV Show as Unwatched',

  'tvshow-average-imdb': ({ amount }) =>
    `Average of ${amount} IMDB user ratings.`,
  'tvshow-average-kinopoisk': ({ amount }) =>
    `Average of ${amount} Kinopoisk user ratings.`,
  'tvshow-average-soap': ({ amount }) =>
    `Average of ${amount} soap4.me user ratings.`,

  'tvshow-liked-by': 'Liked by',
  'tvshow-liked-by-people': ({ likes }) => `${likes} people`,
  'tvshow-liked-by-no-one': 'no one',

  'tvshow-status-ended': 'Ended',
  'tvshow-status-closed': 'Closed',
  'tvshow-status-running': 'Running',

  'tvshow-control-continue-watching': 'Continue Watching',
  'tvshow-control-show-trailer': 'Show\nTrailer',
  'tvshow-control-show-trailers': 'Show\nTrailers',
  'tvshow-control-start-watching': 'Start Watching',
  'tvshow-control-stop-watching': 'Stop Watching',
  'tvshow-control-rate': 'Rate TV Show',
  'tvshow-control-more': 'More',

  'new-episode-soon': 'Soon',
  'new-episode-day': 'Episode in a day',
  'new-episode-custom-date': ({ date }) => `Episode ${date}`,

  'new-season-soon': 'Soon',
  'new-season-day': 'Season in a day',
  'new-season-custom-date': ({ date }) => `Season ${date}`,

  'movies-group-by': 'Group by',
  'movies-group-by-title': ({ title }) => `Group by ${title}`,

  'movies-group-title-latest': 'Latest Added',
  'movies-group-latest-title': 'Latest Movies',

  'movies-group-title-name': 'Name',
  'movies-group-name-title': 'A — Z',

  'movies-group-title-date': 'Date',

  'movies-group-title-likes': 'Likes',
  'movies-group-likes-title-over-thousand': ({ thousand }) =>
    `Over ${thousand}k`,
  'movies-group-likes-title-over-hundred': ({ hundred }) => `Over ${hundred}`,
  'movies-group-likes-title-lower-hundred': ({ hundred }) => `Lower ${hundred}`,

  'movies-group-title-rating': 'Rating',

  'movies-group-title-franchise': 'Franchise',

  'movies-group-title-country': 'Country',

  'movies-group-title-favorite': 'Favorites',
  'movies-group-name-favorite': 'My favorites',

  'movies-group-title-genres': 'Genre',
  'movies-group-by-genres-title': ({ title }) => `Filter by ${title}`,

  'movie-title': ({ title }) => title || '',
  'movie-description': ({ description }) => description || '',
  'movie-runtime': ({ runtime }) =>
    runtime ? runtime.replace('ч', 'h').replace('м', 'm') : '',
  'movie-genres': 'Genres',
  'movie-directors': 'Directors',
  'movie-actors': 'Actors',
  'movie-franchise': 'Franchise',
  'movie-ratings': 'Ratings and Reviews',
  'movie-cast-crew': 'Cast and Crew',

  'movie-information': 'Information',
  'movie-information-year': 'Year',
  'movie-information-runtime': 'Runtime',
  'movie-information-country': 'Country',
  'movie-information-budget': 'Budget',
  'movie-information-gross_worldwide': 'Gross worldwide',

  'movie-information-languages': 'Languages',
  'movie-information-languages-primary': 'Primary',
  'movie-information-languages-primary-values': 'Russian, English',

  'movie-liked-by': 'Liked by',
  'movie-liked-by-people': ({ likes }) => `${likes} people`,
  'movie-liked-by-no-one': 'no one',

  'movie-control-watch': 'Watch',
  'movie-control-mark-as-watched': 'Mark as Watched',
  'movie-control-favorite': 'Add to Favorite',
  'movie-control-unfavorite': 'Remove from Favorite',
  'movie-control-rate': 'Rate Movie',
  'movie-control-more': 'More',

  'movie-title-more': 'More',
  'movie-mark-as-unwatched': 'Mark Movie as Unwatched',

  'movie-franchise-title': ({ franchise }) => `Franchise: ${franchise}`,

  'movie-imdb-title': 'IMDB',
  'movie-average-imdb': ({ amount }) =>
    `${amount} vote${pluralSuffix(amount, {
      singular: '',
      plural: 's',
    })}`,

  'movie-kinopoisk-title': 'Kinopoisk',
  'movie-average-kinopoisk': ({ amount }) =>
    `${amount} vote${pluralSuffix(amount, {
      singular: '',
      plural: 's',
    })}`,

  'movie-soap-title': 'soap4.me',
  'movie-average-soap': ({ amount }) =>
    `${amount} vote${pluralSuffix(amount, {
      singular: '',
      plural: 's',
    })}`,

  'my-caption': 'My',

  'my-closed': 'Closed',
  'my-watched': 'Watched',
  'my-new-episodes': 'New episodes',

  'my-empty-list-title': "You don't have any subscriptions",
  'my-empty-list-description':
    'You can start from adding some tv series from "TV Shows" sections',
  'my-empty-list-button': 'Go to "TV Shows"',

  'tvshows-caption': 'TV Shows',

  'tvshows-group-by': 'Group by',
  'tvshows-group-by-title': ({ title }) => `Group by ${title}`,

  'tvshows-group-title-latest': 'Latest Added',
  'tvshows-group-latest-title': 'Latest TV Shows',

  'tvshows-group-title-recommendations': 'Recommendations',
  'tvshows-group-recommendations-title': 'My recommendations',

  'tvshows-group-title-name': 'Name',
  'tvshows-group-name-title': 'A — Z',

  'tvshows-group-title-date': 'Date',

  'tvshows-group-title-likes': 'Likes',
  'tvshows-group-likes-title-over-thousand': ({ thousand }) =>
    `Over ${thousand}k`,
  'tvshows-group-likes-title-over-hundred': ({ hundred }) => `Over ${hundred}`,
  'tvshows-group-likes-title-lower-hundred': ({ hundred }) =>
    `Lower ${hundred}`,

  'tvshows-group-title-rating': 'Rating',

  'tvshows-group-title-country': 'Country',

  'tvshows-group-title-completeness': 'Completeness',
  'tvshows-group-completeness-title': 'Completed',

  'tvshows-group-title-uhd': '4K (UHD)',
  'tvshows-group-uhd-title': 'A — Z',

  'tvshows-group-title-genres': 'Genre',
  'tvshows-group-by-genres-title': ({ title }) => `Filter by ${title}`,

  'search-latest': 'Latest TV Shows',
  'search-popular': 'Popular TV Shows',
  'search-persons': 'Persons',
  'search-actor': 'Actor',
  'search-tvshows': 'TV Shows',
  'search-movies': 'Movies',

  'actor-tvshows': 'TV Shows',
  'actor-movies': 'Movies',
  'actor-title': 'Actor',

  'director-movies': 'Movies',
  'director-title': 'Director',

  'writer-movies': 'Movies',
  'writer-title': 'Writer',

  'authorize-caption': 'Authorization',
  'authorize-description':
    'You need to be authorized in order to see your subscriptions or watch content',
  'authorize-user-description':
    'If you want your tv to be in sync with your online account at soap4.me you need to be authorized.\n\nAuthorization is also required to manage your subscriptions and rate tv shows with episodes from tv.',
  'authorize-tvshow-description':
    'If you would like to track your subscriptions and sync them with your online account at soap4.me you need to be authorized',
  'authorize-control-trigger': 'Authorize',

  'login-step1-caption': 'Enter user login (not e-mail)',
  'login-step1-placeholder': 'Login',
  'login-step1-button': 'Next',

  'login-step2-caption': 'Enter account password (minimum 6 symbols)',
  'login-step2-placeholder': 'Password',
  'login-step2-button': 'Authorize',

  'login-step3-caption': 'Authorizing...',

  'login-error-wrong-login': 'Incorrect login or password',
  'login-error-something-went-wrong': 'Something went wrong =(',

  'translation-localization': 'Localization',
  'translation-subtitles': 'Subtitles',
};
