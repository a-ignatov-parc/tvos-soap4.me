/* eslint camelcase: "off" */

import { supportUHD } from '../request/soap';

export default {
  'auth-checking': 'Проверяем авторизацию...',

  'menu-my': 'Мои',
  'menu-all': 'Сериалы',
  'menu-search': 'Поиск',
  'menu-genres': 'Жанры',
  'menu-account': 'Аккаунт',
  'menu-settings': 'Настройки',
  'menu-recomendations': 'Рекомендации',

  'genres-caption': 'Жанры',

  'user-caption': 'Аккаунт',
  'user-description': ({ till }) => `Расширенный аккаунт истекает ${till}`,

  'user-account-active': 'Активный',
  'user-turn-on-family-account-button': 'Включить Семейный Аккаунт',
  'user-turn-on-family-account-title':
    'Ты уверен, что хочешь включить Семейный Аккаунт?',
  'user-turn-on-family-account-action_button': 'Включить',
  'user-turn-off-family-account-button': 'Выключить Семейный Аккаунт',
  'user-turn-off-family-account-title':
    'Ты уверен, что хочешь выключить Семейный Аккаунт?',
  'user-turn-off-family-account-action_button': 'Выключить',
  'user-switch-family-account-cancel_button': 'Отмена',

  'user-add-account-button': 'Добавить новый аккаунт',
  'user-add-account-form-title': 'Создание аккаунта',
  'user-add-account-form-description': 'Введи имя для нового аккаунта.',
  'user-add-account-form-button': 'Добавить',

  'user-action-menu-title': ({ name }) => `Что сделать с аккаунтом "${name}"?`,
  'user-action-set-as-active-button': 'Сделать активным',
  'user-action-rename-button': 'Переименовать',
  'user-action-delete-button': 'Удалить',

  'user-rename-account-form-title': ({ name }) =>
    `Переименовать аккаунт "${name}"`,
  'user-rename-account-form-description': 'Введи новое имя для аккаунта.',
  'user-rename-account-form-button': 'Обновить',

  'user-logout-button': 'Выйти из аккаунта',
  'user-logout-caption': 'Точно выйти из аккаунта?',
  'user-logout-logout_button': 'Выйти',
  'user-logout-cancel_button': 'Отмена',

  'settings-caption': 'Настройки',

  'settings-titles-network': 'Сеть',
  'settings-titles-about': 'О программе',

  'settings-labels-video_quality': 'Качество видео',
  'settings-labels-translation': 'Перевод серий',
  'settings-labels-video_playback': 'Воспроизведение видео',
  'settings-labels-language': 'Язык интерфейса',
  'settings-labels-speedtest': 'Тест скорости',
  'settings-labels-version': 'Версия',

  'settings-descriptions-video_quality': `Предпочитаемое качество видео для воспроизведения если оно доступно.\n4K (UHD) видео${
    supportUHD ? ' ' : ' не '
  }поддерживается на данном девайсе.`,
  'settings-descriptions-translation':
    'Для того чтоб просматривать эпизоды с субтитрами необходимо активировать специальный параметр в настройках сайта soap4.me. В противном случае будут отображаться только серии с переводом.',
  'settings-descriptions-video_playback':
    'Настройка воспроизведения серий. Воспроизводить их непрерывно друг за другом или по эпизоду.',

  'settings-values-sd': 'SD',
  'settings-values-hd': 'HD',
  'settings-values-fhd': 'Full HD',
  'settings-values-uhd': '4K (UHD)',
  'settings-values-subtitles': 'Приоритет субтитров',
  'settings-values-localization': 'Приоритет локализации',
  'settings-values-continues': 'Без остановки',
  'settings-values-by_episode': 'По эпизоду',
  'settings-values-auto': 'Язык системы',
  'settings-values-en': 'English',
  'settings-values-ru': 'Русский',

  'speedtest-caption': 'Тест скорости',
  'speedtest-loading': 'Загрузка информации о серверах...',
  'speedtest-begin': 'Начать тест',
  'speedtest-testing': 'Тестируем скорость загрузки...',
  'speedtest-footnote':
    'Необходимо дождаться завершение теста иначе результаты не будут применимы',
  'speedtest-error-title': 'Что-то пошло не так =(',
  'speedtest-error-description':
    'Пожалуйста проверьте свое интернет соединение и попробуйте еще раз',

  'speedtest-result': ({ speed }) => `${speed} Мб/с`,
  'speedtest-result-too-slow': 'Слишком медленно. Пропускаем...',

  'speedtest-country-fr': 'Франция',
  'speedtest-country-de': 'Германия',
  'speedtest-country-nl': 'Нидерланды',
  'speedtest-country-ru': 'Россия',
  'speedtest-country-lt': 'Литва',
  'speedtest-country-by': 'Беларусь',
  'speedtest-country-ca': 'Канада',
  'speedtest-country-es': 'Испания',
  'speedtest-country-gb': 'Великобритания',
  'speedtest-country-it': 'Италия',
  'speedtest-country-se': 'Швеция',
  'speedtest-country-sg': 'Сингапур',
  'speedtest-country-us': 'США',
  'speedtest-country-il': 'Израиль',
  'speedtest-country-md': 'Молдова',
  'speedtest-country-pl': 'Польша',
  'speedtest-country-at': 'Австрия',
  'speedtest-country-bg': 'Болгария',
  'speedtest-country-cz': 'Чехия',

  'episode-more': 'Еще',
  'episode-mark-as-watched': 'Отметить просмотренным',
  'episode-mark-as-unwatched': 'Отметить непросмотренным',
  'episode-speedtest': 'Тест скорости',
  'episode-rate': 'Оценить эпизод',
  'episode-rate-title': ({ timeout }) =>
    `Оцените эпизод${timeout ? ` или подождите ${timeout} сек.` : ''}`,

  'season-title-more': 'Еще',
  'season-mark-as-watched': 'Отметить сезон как просмотренный',
  'season-mark-as-unwatched': 'Отметить сезон как не просмотренный',

  'tvshow-title': ({ title_ru }) => title_ru,
  'tvshow-title-from-episode': ({ soap_ru }) => soap_ru,
  'tvshow-episode-title': ({ title_ru }) => title_ru,
  'tvshow-episode-airdate': ({ airdate }) => `Выходит ${airdate}`,
  'tvshow-episode-menu-hint': 'удерживайте для открытия меню эпизода',
  'tvshow-season': ({ seasonNumber }) => `Сезон ${seasonNumber}`,

  'tvshow-status': 'Статус',
  'tvshow-genres': 'Жанры',
  'tvshow-actors': 'Актеры',
  'tvshow-seasons': 'Сезоны',
  'tvshow-also-watched': 'Рекомендации',
  'tvshow-ratings': 'Рейтинги и Отзывы',
  'tvshow-cast-crew': 'Актеры',

  'tvshow-information': 'Информация',
  'tvshow-information-year': 'Год',
  'tvshow-information-runtime': 'Тайминг',
  'tvshow-information-country': 'Страна',
  'tvshow-information-network': 'Телесеть',

  'tvshow-languages': 'Языки',
  'tvshow-languages-primary': 'Основные',
  'tvshow-languages-primary-values': 'Русский, Английский',

  'tvshow-title-more': 'Еще',
  'tvshow-mark-as-watched': 'Отметить Сериал как просмотренный',
  'tvshow-mark-as-unwatched': 'Отметить Сериал как не просмотренный',

  'tvshow-average-imdb': ({ amount }) =>
    `На основе рейтинга ${amount} пользователей IMDB.`,
  'tvshow-average-kinopoisk': ({ amount }) =>
    `На основе рейтинга ${amount} пользователей Кинопоиска.`,
  'tvshow-average-soap': ({ amount }) =>
    `На основе рейтинга ${amount} пользователей soap4.me.`,

  'tvshow-liked-by': 'Нравится',
  'tvshow-liked-by-people': ({ likes }) => `пользователям: ${likes}`,
  'tvshow-liked-by-no-one': 'никому',

  'tvshow-status-ended': 'Закончен',
  'tvshow-status-closed': 'Закрыт',
  'tvshow-status-running': 'Идет показ',

  'tvshow-control-continue-watching': 'Продолжить Просмотр',
  'tvshow-control-show-trailer': 'Посмотреть Трейлер',
  'tvshow-control-show-trailers': 'Посмотреть Трейлеры',
  'tvshow-control-start-watching': 'Начать Просмотр',
  'tvshow-control-stop-watching': 'Закончить Просмотр',
  'tvshow-control-rate': 'Оценить Сериал',
  'tvshow-control-more': 'Еще',

  'new-episode-soon': 'Скоро',
  'new-episode-day': 'Эпизод в течение дня',
  'new-episode-custom-date': ({ date }) => `Эпизод ${date}`,

  'new-season-soon': 'Скоро',
  'new-season-day': 'Сезон в течение дня',
  'new-season-custom-date': ({ date }) => `Сезон ${date}`,

  'my-caption': 'Мои',

  'my-closed': 'Завершенные',
  'my-watched': 'Просмотренные',
  'my-new-episodes': 'С новыми эпизодами',

  'my-empty-list-title': 'У тебя нет никаких подписок',
  'my-empty-list-description':
    'Ты можешь начать с добавления каких-нибудь сериалов из раздела "Сериалы"',
  'my-empty-list-button': 'Перейти в раздел "Сериалы"',

  'my-recomendations': 'Мои рекомендации',
  'my-empty-recomendations': 'У тебя пока что нет никаких рекомендаций',

  'all-caption': 'Сериалы',

  'all-group-by': 'Группировать по',
  'all-group-by-title': ({ title }) => `Группировать по ${title}`,

  'all-group-title-name': 'Имени',
  'all-group-name-title': 'A — Z',

  'all-group-title-date': 'Дате',

  'all-group-title-likes': 'Лайкам',
  'all-group-likes-title-over-thousand': ({ thousand }) => `Более ${thousand}k`,
  'all-group-likes-title-over-hundred': ({ hundred }) => `Более ${hundred}`,
  'all-group-likes-title-lower-hundred': ({ hundred }) => `Менее ${hundred}`,

  'all-group-title-rating': 'Рейтингу',

  'all-group-title-country': 'Стране',

  'all-group-title-completeness': 'Завершенности',
  'all-group-completeness-title': 'Завершенные',

  'all-group-title-uhd': '4K (UHD)',
  'all-group-uhd-title': 'A — Z',

  'search-latest': 'Новые сериалы',
  'search-popular': 'Популярные сериалы',
  'search-persons': 'Люди',
  'search-actor': 'Актер / Актриса',
  'search-tvshows': 'Сериалы',

  'actor-tvshows': 'Сериалы',
  'actor-title': 'Актер / Актриса',

  'authorize-caption': 'Авторизация',
  'authorize-description':
    'Для того чтоб просматривать свои подписки и контент необходимо авторизоваться',
  'authorize-user-description':
    'Вам потребуется авторизоваться если вы хотите чтоб ваш tv синхронизировался с аккаунтом на soap4.me.\n\nАвторизация так же потребуется для управления подписками и выставления рейтингов для сериалов и эпизодов с tv.',
  'authorize-tvshow-description':
    'Вам потребуется авторизоваться если вы захотите отслеживать подписки и синхронизироваться их с аккаунтом на soap4.me',
  'authorize-control-trigger': 'Авторизоваться',

  'login-step1-caption': 'Введите логин (e-mail не является логином)',
  'login-step1-placeholder': 'Логин',
  'login-step1-button': 'Далее',

  'login-step2-caption': 'Введите пароль (минимум 6 символов)',
  'login-step2-placeholder': 'Пароль',
  'login-step2-button': 'Авторизоваться',

  'login-step3-caption': 'Авторизация...',

  'login-error-wrong-login': 'Не верный логин или пароль',
  'login-error-something-went-wrong': 'Что-то пошло не так =(',

  'translation-localization': 'Озвучка',
  'translation-subtitles': 'Субтитры',
};
