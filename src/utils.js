/* global sessionStorage navigationDocument Device */

import { Promise, navigate } from 'tvdml';

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
  return `${text}`.split(' ').map(capitalize).join(' ');
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
    try { navigationDocument.removeDocument(document); } catch (e) {}
  }
}

export function genreToId(genre) {
  return genre.replace(/\s/g, '_');
}
