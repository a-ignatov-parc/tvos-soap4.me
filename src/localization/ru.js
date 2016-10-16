export default {
	'auth-checking': 'Проверяем авторизацию...',

	'menu-my': 'Мои',
	'menu-all': 'Сериалы',
	'menu-search': 'Поиск',
	'menu-settings': 'Настройки',

	'settings-caption': 'Настройки',

	'settings-logout-caption': 'Точно выйти из аккаунта?',
	'settings-logout-logout_btn': 'Выйти',
	'settings-logout-cancel_btn': 'Отмена',

	'settings-titles-account': 'Акканут',
	'settings-titles-network': 'Сеть',
	'settings-titles-about': 'О программе',

	'settings-labels-video_quality': 'Качество видео',
	'settings-labels-translation': 'Перевод серий',
	'settings-labels-video_playback': 'Воспроизведение видео',
	'settings-labels-language': 'Язык интерфейса',
	'settings-labels-login': 'Войти в аккаунт',
	'settings-labels-logout': 'Выйти из аккаунта',
	'settings-labels-speedtest': 'Тест скорости',
	'settings-labels-version': 'Версия',

	'settings-descriptions-video_quality': 'Prefered video quality that will be used if available.',
	'settings-descriptions-translation': 'To be able to use subtitles special option must be activated in account preferences on soap4.me site. Until this will be done only localized episodes will be shown.',
	'settings-descriptions-video_playback': 'Configure player playback mode. Should it play all episodes in season or just one.',

	'settings-values-sd': 'SD',
	'settings-values-hd': 'HD',
	'settings-values-fhd': 'Full HD',
	'settings-values-subtitles': 'Приоритет субтитров',
	'settings-values-localization': 'Приоритет локализации',
	'settings-values-continues': 'Без остановки',
	'settings-values-by_episode': 'По эпизоду',
	'settings-values-auto': 'Язык системы',
	'settings-values-en': 'English',
	'settings-values-ru': 'Русский',

	'tvshow-title': ({title_ru}) => title_ru,
	'tvshow-title-from-episode': ({soap_ru}) => soap_ru,
	'tvshow-episode-title': ({title_ru}) => title_ru,
	'tvshow-season': ({seasonNumber}) => `Сезон ${seasonNumber}`,

	'new-episode-soon': 'Скоро',
	'new-episode-day': 'Эпизод в течении дня',
	'new-episode-custom-date': ({date}) => `Эпизод ${date}`,

	'my-caption': 'Мои',

	'my-closed': 'Завершенные',
	'my-watched': 'Просмотренные',
	'my-new-episodes': 'С новыми эпизодами',

	'all-caption': 'Сериалы',

	'all-group-by': 'Группировать по',
	'all-group-by-title': ({title}) => `Группировать по ${title}`,

	'all-group-title-name': 'Имени',
	'all-group-name-title': 'A — Z',

	'all-group-title-date': 'Дате',

	'all-group-title-likes': 'Лайкам',
	'all-group-likes-title-over-thousand': ({thousand}) => `Более ${thousand}k`,
	'all-group-likes-title-over-hundred': ({hundred}) => `Более ${hundred}`,
	'all-group-likes-title-lower-hundred': ({hundred}) => `Менее ${hundred}`,

	'all-group-title-rating': 'Рейтингу',

	'all-group-title-completeness': 'Завершенности',
	'all-group-completeness-title': 'Завершенные',

	'search-latest': 'Новые сериалы',
	'search-popular': 'Популярные сериалы',
	'search-persons': 'Люди',
	'search-actor': 'Актер',
	'search-tvshows': 'Сериалы',
};
