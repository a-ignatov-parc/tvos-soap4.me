import * as TVDML from 'tvdml';

import compose from 'recompose/compose';
import withState from 'recompose/withState';
import lifecycle from 'recompose/lifecycle';

import { renderModalWithRuntime } from '../utils';

import withTvshows from '../hocs/withTvshows';
import withDictionaries from '../hocs/withDictionaries';

import Text from '../components/Text';
import Tile from '../components/Tile';
import Loader from '../components/Loader';
import TextIndent from '../components/TextIndent';
import TilePrototypes from '../components/TilePrototypes';

// TODO: Don't forget to show `UHD` section for authorized users.
const UHD = 'uhd';
const NAME = 'name';
const DATE = 'date';
const LIKES = 'likes';
const RATING = 'rating';
const COUNTRY = 'country';
const COMPLETENESS = 'completeness';

const sections = {
  [NAME]: {
    title: <Text i18n='all-group-title-name' />,
    reducer(list) {
      const collection = list
        .sort(({ title: a }, { title: b }) => a.localeCompare(b))
        .reduce((result, item) => {
          let letter = item.title[0].toUpperCase();
          if (/\d/.test(letter)) letter = '0 — 9';
          if (!result[letter]) result[letter] = [];
          result[letter].push(item);
          return result;
        }, {});

      return Object
        .keys(collection)
        .map(letter => ({
          title: letter,
          items: collection[letter],
        }));
    },
  },

  [DATE]: {
    title: <Text i18n='all-group-title-date' />,
    reducer(list) {
      const collection = list
        .slice(0)
        .sort(({ sid: a }, { sid: b }) => b - a)
        .reduce((result, item) => {
          if (!result[item.year]) result[item.year] = [];
          result[item.year].push(item);
          return result;
        }, {});

      return Object
        .keys(collection)
        .sort((a, b) => b - a)
        .map(year => ({
          title: year,
          items: collection[year],
        }));
    },
  },

  [LIKES]: {
    title: <Text i18n='all-group-title-likes' />,
    reducer(list) {
      const likesCollection = list
        .slice(0)
        .sort(({ likes: a }, { likes: b }) => b - a)
        .reduce((result, item) => {
          const thousand = ~~(item.likes / 1000);
          const hundred = ~~(item.likes / 100);
          const key = thousand ? thousand * 10 : hundred;

          if (!result[key]) {
            result[key] = {
              thousand,
              hundred,
              likes: [],
              items: [],
            };
          }
          result[key].likes.push(item.likes);
          result[key].items.push(item);
          return result;
        }, {});

      return Object
        .keys(likesCollection)
        .sort((a, b) => b - a)
        .map(key => {
          const { thousand, hundred, items } = likesCollection[key];

          let title = (
            <Text
              i18n='all-group-likes-title-over-thousand'
              payload={{ thousand }}
            />
          );

          if (!thousand) {
            if (hundred) {
              title = (
                <Text
                  i18n='all-group-likes-title-over-hundred'
                  payload={{ hundred: hundred * 100 }}
                />
              );
            } else {
              title = (
                <Text
                  i18n='all-group-likes-title-lower-hundred'
                  payload={{ hundred: (hundred + 1) * 100 }}
                />
              );
            }
          }
          return { title, items };
        });
    },
  },

  [RATING]: {
    title: <Text i18n='all-group-title-rating' />,
    reducer(list) {
      const collection = list.reduce((result, item) => {
        if (!result[item.imdb_rating]) result[item.imdb_rating] = [];
        result[item.imdb_rating].push(item);
        return result;
      }, {});

      return Object
        .keys(collection)
        .sort((a, b) => b - a)
        .map(rating => ({
          title: rating,
          items: collection[rating],
        }));
    },
  },

  [COUNTRY]: {
    title: <Text i18n='all-group-title-country' />,
    reducer(list, { countries }) {
      const collection = list.reduce((result, item) => {
        if (!result[item.country]) result[item.country] = [];
        result[item.country].push(item);
        return result;
      }, {});

      return countries.map(country => ({
        title: country.full,
        items: collection[country.short],
      }));
    },
  },

  [COMPLETENESS]: {
    title: <Text i18n='all-group-title-completeness' />,
    reducer(list) {
      return [{
        title: <Text i18n='all-group-completeness-title' />,
        items: list.filter(({ status }) => +status),
      }];
    },
  },
};

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

function onGroupSelect(activeGroupId, setActiveGroupId) {
  const sectionsList = Object
    .keys(sections)
    .map(groupId => ({
      groupId,
      title: sections[groupId].title,
    }));

  const pipeline = renderModalWithRuntime(() => (
    <document>
      <alertTemplate>
        <title>
          <Text i18n='all-group-by' />
        </title>
        {sectionsList.map(({ groupId, title }) => (
          <button
            key={groupId}
            autoHighlight={groupId === activeGroupId}
            onSelect={() => setActiveGroupId(groupId, TVDML.removeModal)}
          >
            <text>{title}</text>
          </button>
        ))}
      </alertTemplate>
    </document>
  ));

  pipeline.sink();
}

function All(props) {
  const {
    tvshows,
    countries,
    activeGroupId,
    setActiveGroupId,
    fetchingTvshows,
    fetchingDictionaries,
  } = props;

  if (fetchingTvshows || fetchingDictionaries) {
    return (
      <Loader />
    );
  }

  const activeGroup = sections[activeGroupId];
  const listItems = activeGroup.reducer(tvshows, { countries });

  return (
    <document>
      <catalogTemplate>
        <banner>
          <title>
            <Text i18n='all-caption' />
          </title>
        </banner>
        <list>
          <prototypes>
            <TilePrototypes />
          </prototypes>
          <segmentBarHeader>
            <button
              style={{ width: 500 }}
              onSelect={onGroupSelect.bind(
                this,
                activeGroupId,
                setActiveGroupId,
              )}
            >
              <text style={{ tvAlign: 'center' }}>
                <Text i18n='all-group-by' />
                <TextIndent />
                {activeGroup.title}
                <TextIndent />
                <badge
                  width='31'
                  height='14'
                  src='resource://button-dropdown'
                  style={{
                    margin: '0 0 5 0',
                    tvTintColor: 'rgb(255, 255, 255)',
                  }}
                />
              </text>
            </button>
          </segmentBarHeader>
          <section>
            {listItems.map((listItem, i) => {
              const {
                title,
                items,
              } = listItem;

              return (
                <listItemLockup key={`${activeGroupId}-${i}`}>
                  <title>{title}</title>
                  <decorationLabel>
                    {items.length}
                  </decorationLabel>
                  <relatedContent>
                    <grid>
                      <section
                        binding='items:{tvshows}'
                        onSelect={onTileSelect}
                        dataItem={{
                          tvshows: items.map(tvshow => {
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

                            // Data bindings can't work with numbers.
                            item.count = `${unwatched}`;

                            return item;
                          }),
                        }}
                      />
                    </grid>
                  </relatedContent>
                </listItemLockup>
              );
            })}
          </section>
        </list>
      </catalogTemplate>
    </document>
  );
}

export default compose(
  withTvshows,
  withDictionaries,
  lifecycle({
    componentDidMount() {
      this.props.getAllTvShows();
      this.props.getAllDictionaries();
    },
  }),
  withState('activeGroupId', 'setActiveGroupId', NAME),
)(All);
