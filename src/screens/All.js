import * as TVDML from 'tvdml';

import compose from 'recompose/compose';
import mapProps from 'recompose/mapProps';
import lifecycle from 'recompose/lifecycle';

import store from '../redux/store';

import { getAllTvShows } from '../redux/molecules/tvshows';

import withTvshows from '../hocs/withTvshows';

import Text from '../components/Text';
import Tile from '../components/Tile';
import Loader from '../components/Loader';
import TilePrototypes from '../components/TilePrototypes';

function onTileSelect(event) {
  const {
    sid,
    title,
    poster,
  } = event.target.dataItem;

  TVDML.navigate('tvshow', {
    sid,
    title,
    poster,
  });
}

function All(props) {
  const {
    tvshows,
    fetchingTvshows,
  } = props;

  if (fetchingTvshows) {
    return (
      <Loader />
    );
  }

  return (
    <document>
      <stackTemplate>
        <banner>
          <title>
            <Text i18n='all-caption' />
          </title>
        </banner>
        <collectionList>
          <grid>
            <prototypes>
              <TilePrototypes />
            </prototypes>
            <section
              binding='items:{tvshows}'
              onSelect={onTileSelect}
              dataItem={{
                tvshows: tvshows.map(tvshow => {
                  const {
                    sid,
                    watching,
                    unwatched,
                    covers: { big: poster },
                  } = tvshow;

                  const tvShowTitle = tvshow.title;

                  const isUHD = !!tvshow['4k'];
                  const isWatched = watching > 0 && !unwatched;

                  const prototypeNameParts = [
                    'tvshow-tile',
                    isUHD ? 'uhd' : 'hd',
                  ];

                  if (!isWatched && unwatched) {
                    prototypeNameParts.push('watched-count');
                  } else if (isWatched) {
                    prototypeNameParts.push('watched-all');
                  } else {
                    prototypeNameParts.push('not-watched');
                  }

                  const prototypeName = prototypeNameParts
                    .filter(Boolean)
                    .join('-');

                  /**
                   * All available `Tile` prototypes can be found
                   * in `TilePrototypes` component.
                   */
                  const item = new DataItem(prototypeName, sid);

                  item.sid = sid;
                  item.poster = poster;
                  item.title = tvShowTitle;
                  item.count = unwatched;

                  return item;
                }),
              }}
            />
          </grid>
        </collectionList>
      </stackTemplate>
    </document>
  );
}

export default compose(
  lifecycle({
    componentDidMount() {
      store.dispatch(getAllTvShows());
    },
  }),
  withTvshows,
)(All);
