/* global StoreInUserDefaults */

import url from 'url';
import { get as i18n } from '../localization';

export function set(data) {
  StoreInUserDefaults('topShelf', JSON.stringify(data));
}

export function mapSeries(item) {
  const title = i18n('tvshow-title', item);
  return {
    id: item.sid,
    title,
    imageURL: item.covers.big,
    displayURL: url.format({
      protocol: 'soap4atv:',
      query: {
        sid: item.sid,
        title,
        poster: item.covers.big,
      },
      pathname: '/tvshow',
    }),
    playURL: url.format({
      protocol: 'soap4atv:',
      query: {
        sid: item.sid,
        title,
        poster: item.covers.big,
        continueWatchingAndPlay: 1,
      },
      pathname: '/tvshow',
    }),
  };
}
