/* global sessionStorage navigationDocument Device MediaItem */

import url from 'url';

import { navigate } from 'tvdml';

import { get as i18n } from './localization';

export function promisedTimeout(timeout) {
  return () => new Promise(resolve => setTimeout(resolve, timeout));
}

export function isMenuButtonPressNavigatedTo(targetDocument) {
  return ({ to: { document } }) => {
    const { menuBarDocument } = document;

    if (menuBarDocument) {
      // eslint-disable-next-line no-param-reassign
      document = menuBarDocument.getDocument(menuBarDocument.getSelectedItem());
    }

    return targetDocument === document;
  };
}

export function log(message = '') {
  return function logger(payload) {
    console.info(message, payload);
    return payload;
  };
}

export function link(route, params) {
  return () => navigate(route, params);
}

export function isQello() {
  return !!~Device.appIdentifier.toLowerCase().indexOf('qello');
}

export function getStartParams() {
  const params = JSON.parse(sessionStorage.getItem('startParams') || '{}');

  // Ad-hoc fix for assets urls
  if (isQello()) {
    const host = 'https://a-ignatov-parc.github.io';
    const path = '/tvos-soap4.me-releases/qello/tvml/';

    params.BASEURL = host + path;
  }

  return params;
}

export function noop() {
  return () => {};
}

export function capitalize(word) {
  const str = `${word}`;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function capitalizeText(text) {
  return `${text}`
    .split(' ')
    .map(capitalize)
    .join(' ');
}

export function seconds(amount) {
  return amount * 1000;
}

export function minutes(amount) {
  return seconds(amount) * 60;
}

export function hours(amount) {
  return minutes(amount) * 60;
}

export function prettifyNum(num, ordinal = 2) {
  return `${10 ** ordinal}${num}`.slice(-ordinal);
}

export function prettifyEpisodeNum(season = 0, episode = 0) {
  return `s${prettifyNum(season)}e${prettifyNum(episode)}`;
}

export function removeDocumentFromNavigation(document) {
  // Workaround for strange tvOS issue when after deleting document
  // from `navigationDocument.documents` it still remains there.
  while (~navigationDocument.documents.indexOf(document)) {
    // eslint-disable-next-line no-empty
    try {
      navigationDocument.removeDocument(document);
    } catch (e) {
      // Noop
    }
  }
}

export function genreToId(genre) {
  return genre.replace(/\s/g, '_');
}

export function getCroppedImageUrl(targetUrl, size) {
  const params = `w=${size}&h=${size}&mode=crop`;
  const descriptor = url.parse(targetUrl);
  const croppedUrl = url.format({
    hostname: 'rsz.io',
    protocol: 'http:',
    pathname: descriptor.hostname + descriptor.pathname,
    search: descriptor.search ? `${descriptor.search}&${params}` : `?${params}`,
  });

  return croppedUrl;
}

export function getMonogramImageUrl(targetUrl) {
  // Broken monogram element rendering will be fixed only on tvOS 11.2
  if (parseFloat(Device.systemVersion) >= 11.2) return targetUrl;
  return getCroppedImageUrl(targetUrl, 250);
}

export function createMediaItem(episode) {
  return Object.keys(episode).reduce((mediaItem, name) => {
    // eslint-disable-next-line no-param-reassign
    mediaItem[name] = episode[name];
    return mediaItem;
  }, new MediaItem('video'));
}

export function getOpenURLParams(str) {
  const { query, pathname } = url.parse(str, true);
  const route = pathname.slice(1);
  return [route, query];
}

export function groupSeriesByCategory(series) {
  const watching = series.filter(item => item.watching > 0);

  // eslint-disable-next-line arrow-body-style
  const ongoing = watching.filter(item => {
    // eslint-disable-next-line eqeqeq
    return item.status == 0 || item.unwatched > 0;
  });
  const unwatched = ongoing.filter(item => item.unwatched > 0);
  const watched = ongoing.filter(item => !item.unwatched);

  // eslint-disable-next-line arrow-body-style
  const closed = watching.filter(item => {
    return item.status > 0 && !item.unwatched;
  });

  return { unwatched, watched, closed };
}

export function sortTvShows(tvshows) {
  return tvshows
    .slice(0)
    .sort((left, right) =>
      i18n('tvshow-title', left).localeCompare(i18n('tvshow-title', right)),
    );
}
