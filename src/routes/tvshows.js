import * as TVDML from 'tvdml';

import * as user from '../user';
import { get as i18n } from '../localization';

import {
  getAllTVShows,
  getCountriesList,
  getGenresList,
  getLatestTvShows,
  getTVShowsByGenre,
} from '../request/soap';

import {
  capitalizeText,
  isMenuButtonPressNavigatedTo,
  sortTvShows,
} from '../utils';
import { deepEqualShouldUpdate } from '../utils/components';

import Tile from '../components/tile';
import Loader from '../components/loader';

const UHD = 'uhd';
const NAME = 'name';
const DATE = 'date';
const LIKES = 'likes';
const RATING = 'rating';
const LATEST = 'latest';
const GENRES = 'genres';
const COUNTRY = 'country';
const COMPLETENESS = 'completeness';

const sections = {
  [LATEST]: {
    title: 'tvshows-group-title-latest',
    reducer(list) {
      return [
        {
          title: i18n('tvshows-group-latest-title'),
          items: getLatestTvShows(list),
        },
      ];
    },
  },

  [NAME]: {
    title: 'tvshows-group-title-name',
    reducer(list) {
      return [
        {
          title: i18n('tvshows-group-name-title'),
          items: sortTvShows(list),
        },
      ];
    },
  },

  [GENRES]: {
    title: 'tvshows-group-title-genres',
    useSubFilter: true,
    reducer() {
      return [];
    },
  },

  [DATE]: {
    title: 'tvshows-group-title-date',
    reducer(list) {
      const collection = list.reduce((result, item) => {
        // eslint-disable-next-line no-param-reassign
        if (!result[item.year]) result[item.year] = [];
        result[item.year].push(item);
        return result;
      }, {});

      return Object.keys(collection)
        .sort((a, b) => b - a)
        .map(year => ({
          title: year,
          items: sortTvShows(collection[year]),
        }));
    },
  },

  [LIKES]: {
    title: 'tvshows-group-title-likes',
    reducer(list) {
      const likesCollection = list
        .slice(0)
        .sort(({ likes: a }, { likes: b }) => b - a)
        .reduce((result, item) => {
          const thousand = ~~(item.likes / 1000);
          const hundred = ~~(item.likes / 100);
          const key = thousand ? thousand * 10 : hundred;

          if (!result[key]) {
            // eslint-disable-next-line no-param-reassign
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

      return Object.keys(likesCollection)
        .sort((a, b) => b - a)
        .map(key => {
          const { thousand, hundred, items } = likesCollection[key];

          let title = i18n('tvshows-group-likes-title-over-thousand', {
            thousand,
          });

          if (!thousand) {
            if (hundred) {
              title = i18n('tvshows-group-likes-title-over-hundred', {
                hundred: hundred * 100,
              });
            } else {
              title = i18n('tvshows-group-likes-title-lower-hundred', {
                hundred: (hundred + 1) * 100,
              });
            }
          }
          return { title, items };
        });
    },
  },

  [RATING]: {
    title: 'tvshows-group-title-rating',
    reducer(list) {
      const collection = list.reduce((result, item) => {
        // eslint-disable-next-line no-param-reassign
        if (!result[item.imdb_rating]) result[item.imdb_rating] = [];
        result[item.imdb_rating].push(item);
        return result;
      }, {});

      return Object.keys(collection)
        .sort((a, b) => b - a)
        .map(rating => ({
          title: rating,
          items: sortTvShows(collection[rating]),
        }));
    },
  },

  [COUNTRY]: {
    title: 'tvshows-group-title-country',
    reducer(list, { contries }) {
      const collection = list.reduce((result, item) => {
        // eslint-disable-next-line no-param-reassign
        if (!result[item.country]) result[item.country] = [];
        result[item.country].push(item);
        return result;
      }, {});

      return contries.map(country => ({
        title: country.full,
        items: sortTvShows(collection[country.short]),
      }));
    },
  },

  [COMPLETENESS]: {
    title: 'tvshows-group-title-completeness',
    reducer(list) {
      return [
        {
          title: i18n('tvshows-group-completeness-title'),
          items: sortTvShows(list.filter(({ status }) => +status)),
        },
      ];
    },
  },
};

if (user.isExtended()) {
  sections[UHD] = {
    title: 'tvshows-group-title-uhd',
    reducer(list) {
      return [
        {
          title: i18n('tvshows-group-uhd-title'),
          items: sortTvShows(list.filter(item => !!item['4k'])),
        },
      ];
    },
  };
}

export default function tvShowsRoute() {
  return TVDML.createPipeline().pipe(
    TVDML.render(
      TVDML.createComponent({
        getInitialState() {
          const token = user.getToken();

          return {
            token,
            loading: true,
            groupId: LATEST,
            updating: false,
          };
        },

        componentDidMount() {
          const setState = this.setState.bind(this);

          // eslint-disable-next-line no-underscore-dangle
          const currentDocument = this._rootNode.ownerDocument;

          this.menuButtonPressStream = TVDML.subscribe('menu-button-press');
          this.menuButtonPressStream
            .pipe(isMenuButtonPressNavigatedTo(currentDocument))
            .pipe(isNavigated => isNavigated && this.loadData().then(setState));

          this.userStateChangeStream = user.subscription();
          this.userStateChangeStream.pipe(() => {
            const token = user.getToken();

            if (token !== this.state.token) {
              this.setState({ updating: true, token });
            }
          });

          this.loadData().then(payload => {
            this.setState({ loading: false, ...payload });
            this.loadSubGroupData(GENRES, this.getSubGroupId(GENRES));
          });
        },

        componentWillReceiveProps() {
          this.setState({ updating: true });
        },

        componentDidUpdate(prevProps, prevState) {
          if (
            this.state.updating &&
            prevState.updating !== this.state.updating
          ) {
            this.loadData().then(payload => {
              this.setState({ updating: false, ...payload });
            });
          }
        },

        componentWillUnmount() {
          this.menuButtonPressStream.unsubscribe();
          this.userStateChangeStream.unsubscribe();
        },

        shouldComponentUpdate: deepEqualShouldUpdate,

        loadData() {
          return Promise.all([
            getAllTVShows(),
            getCountriesList(),
            getGenresList(),
          ]).then(([series, contries, genres]) => ({
            series,
            contries,
            [this.getSubGroupStatePath(GENRES, ['id'])]: genres[0],
            [this.getSubGroupStatePath(GENRES, ['options'])]: genres.map(
              item => ({ id: item, title: capitalizeText(item) }),
            ),
          }));
        },

        render() {
          if (this.state.loading) {
            return <Loader />;
          }

          const { series, groupId, contries } = this.state;

          const { title: titleCode, reducer, useSubFilter } = sections[groupId];
          const groups = reducer(series, { contries });

          const subGroupId = this.getSubGroupId(groupId);
          const subGroupTitle = this.getSubGroupTitle(groupId, subGroupId);
          const subGroupItems = this.getSubGroupItems(groupId, subGroupId);
          const subGroupIsLoaded = this.getSubGroupIsLoaded(
            groupId,
            subGroupId,
          );

          return (
            <document>
              <head>
                <style
                  content={`
                    .dropdown-badge {
                      tv-tint-color: rgb(84, 82, 80);
                      margin: 0 0 5 0;
                    }

                    @media tv-template and (tv-theme:dark) {
                      .dropdown-badge {
                        tv-tint-color: rgb(132, 133, 135);
                      }
                    }
                  `}
                />
              </head>
              <stackTemplate>
                <collectionList>
                  <separator>
                    <button onSelect={this.onSwitchGroup}>
                      <text>
                        {i18n('tvshows-group-by-title', {
                          title: i18n(titleCode),
                        })}{' '}
                        <badge
                          width="31"
                          height="14"
                          class="dropdown-badge"
                          src="resource://button-dropdown"
                        />
                      </text>
                    </button>
                  </separator>
                  {useSubFilter && (
                    <separator>
                      <button onSelect={this.onSwitchSubgroup}>
                        <text>
                          {i18n(`tvshows-group-by-${groupId}-title`, {
                            title: subGroupTitle,
                          })}{' '}
                          <badge
                            width="31"
                            height="14"
                            class="dropdown-badge"
                            src="resource://button-dropdown"
                          />
                        </text>
                      </button>
                    </separator>
                  )}
                  {useSubFilter &&
                    (subGroupIsLoaded ? (
                      <grid key={`subgroup-${groupId}`}>
                        {this.renderTvshowSection(subGroupItems)}
                      </grid>
                    ) : (
                      <activityIndicator />
                    ))}
                  {!useSubFilter &&
                    groups.map(({ title: groupTitle, items }) => (
                      <grid key={groupTitle}>
                        <header>
                          <title>{groupTitle}</title>
                        </header>
                        {this.renderTvshowSection(items)}
                      </grid>
                    ))}
                </collectionList>
              </stackTemplate>
            </document>
          );
        },

        renderTvshowSection(tvshows) {
          return (
            <section>
              {tvshows.map(tvshow => {
                const {
                  sid,
                  watching,
                  unwatched,
                  covers: { big: poster },
                } = tvshow;

                const isUHD = !!tvshow['4k'];
                const tvShowTitle = i18n('tvshow-title', tvshow);

                return (
                  <Tile
                    key={sid}
                    title={tvShowTitle}
                    route="tvshow"
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
          );
        },

        onSwitchGroup() {
          const sectionsList = Object.keys(sections).map(id => ({
            id,
            title: sections[id].title,
          }));

          TVDML.renderModal(
            <document>
              <alertTemplate>
                <title>{i18n('tvshows-group-by')}</title>
                {sectionsList.map(({ id, title: titleCode }) => {
                  const onGroupSelect = () => {
                    this.setState({ groupId: id });
                    TVDML.removeModal();
                  };

                  return (
                    <button
                      key={id}
                      autoHighlight={id === this.state.groupId || undefined}
                      onSelect={onGroupSelect}
                    >
                      <text>{i18n(titleCode)}</text>
                    </button>
                  );
                })}
              </alertTemplate>
            </document>,
          ).sink();
        },

        getSubGroupStatePath(groupId, statePathItems) {
          return `${groupId}_subgroup_${statePathItems.join(':')}`;
        },

        getSubGroupState(groupId, statePathItems) {
          return this.state[this.getSubGroupStatePath(groupId, statePathItems)];
        },

        setSubGroupStateValue(groupId, statePathItems, value) {
          this.setState({
            [this.getSubGroupStatePath(groupId, statePathItems)]: value,
          });
        },

        setSubGroupState(groupId, statePathItems, state) {
          const newState = {};

          Object.keys(state).forEach(key => {
            newState[
              this.getSubGroupStatePath(groupId, [...statePathItems, key])
            ] = state[key];
          });

          this.setState(newState);
        },

        getSubGroupId(groupId) {
          return this.getSubGroupState(groupId, ['id']);
        },

        setSubGroupId(groupId, subGroupId) {
          this.setSubGroupStateValue(groupId, ['id'], subGroupId);
        },

        getSubGroupOptions(groupId) {
          return this.getSubGroupState(groupId, ['options']) || [];
        },

        getSubGroupTitle(groupId, subGroupId) {
          const options = this.getSubGroupOptions(groupId, subGroupId);
          const option = options.find(item => item.id === subGroupId);
          return option ? option.title : '';
        },

        getSubGroupIsLoaded(groupId, subGroupId) {
          return !!this.getSubGroupState(groupId, [subGroupId, 'loaded']);
        },

        getSubGroupItems(groupId, subGroupId) {
          return this.getSubGroupState(groupId, [subGroupId, 'items']) || [];
        },

        setSubGroupItems(groupId, subGroupId, items) {
          this.setSubGroupState(groupId, [subGroupId], {
            loaded: true,
            items,
          });
        },

        onSwitchSubgroup() {
          const { groupId } = this.state;
          const subGroupId = this.getSubGroupId(groupId);
          const subGroupOptions = this.getSubGroupOptions(groupId);

          TVDML.renderModal(
            <document>
              <alertTemplate>
                <title>{i18n('tvshows-group-by')}</title>
                {subGroupOptions.map(({ id, title }) => {
                  const onGroupSelect = () => {
                    this.setSubGroupId(groupId, id);
                    this.loadSubGroupData(groupId, id);
                    TVDML.removeModal();
                  };

                  return (
                    <button
                      key={id}
                      autoHighlight={id === subGroupId || undefined}
                      onSelect={onGroupSelect}
                    >
                      <text>{title}</text>
                    </button>
                  );
                })}
              </alertTemplate>
            </document>,
          ).sink();
        },

        loadSubGroupData(groupId, subGroupId) {
          switch (groupId) {
            case GENRES: {
              return getTVShowsByGenre(subGroupId).then(items => {
                this.setSubGroupItems(groupId, subGroupId, items);
              });
            }
            default: {
              throw new Error(`Subgroups not supported for ${groupId}`);
            }
          }
        },
      }),
    ),
  );
}
