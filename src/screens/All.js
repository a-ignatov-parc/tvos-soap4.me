import compose from 'recompose/compose';
import mapProps from 'recompose/mapProps';
import lifecycle from 'recompose/lifecycle';

import store from '../redux/store';

import { getAllTvShows } from '../redux/molecules/tvshows';

import withTvshows from '../hocs/withTvshows';

import Tile from '../components/Tile';
import Loader from '../components/Loader';

function All(props) {
  const {
    tvshows,
    fetchingTvshows,
  } = props;

  console.log(666, props);

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
            All
          </title>
        </banner>
        <collectionList>
          <grid>
            <section>
              {tvshows.map(tvshow => {
                const {
                  sid,
                  watching,
                  unwatched,
                  covers: { big: poster },
                } = tvshow;

                const isUHD = !!tvshow['4k'];
                const tvShowTitle = tvshow.title;

                return (
                  <Tile
                    key={sid}
                    title={tvShowTitle}
                    route='tvshow'
                    poster={poster}
                    counter={unwatched}
                    isWatched={watching > 0 && !unwatched}
                    isUHD={isUHD}
                    payload={{
                      sid,
                      poster,
                      title: tvShowTitle,
                    }}
                  />
                );
              })}
            </section>
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
