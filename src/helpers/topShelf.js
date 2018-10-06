/* global StoreInUserDefaults */

import { get as i18n } from '../localization';

export function set(data) {
  StoreInUserDefaults('topShelf', JSON.stringify(data));
}

export function mapSeries(item) {
  return {
    id: item.sid,
    title: i18n('tvshow-title', item),
    imageURL: item.covers.big,
  };
}
