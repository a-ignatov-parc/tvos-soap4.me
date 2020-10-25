import * as TVDML from 'tvdml';

import * as user from '../user';
import { get as i18n } from '../localization';

import { getAllTVShows, getCountriesList } from '../request/soap';

import { isMenuButtonPressNavigatedTo, sortTvShows } from '../utils';
import { deepEqualShouldUpdate } from '../utils/components';

import Tile from '../components/tile';
import Loader from '../components/loader';

const UHD = 'uhd';
const NAME = 'name';
const DATE = 'date';
const LIKES = 'likes';
const RATING = 'rating';
const COUNTRY = 'country';
const COMPLETENESS = 'completeness';

const sections = {
  [NAME]: {
    title: 'all-group-title-name',
    reducer(list) {
      return [
        {
          title: i18n('all-group-name-title'),
          items: sortTvShows(list),
        },
      ];
    },
  },

  [DATE]: {
    title: 'all-group-title-date',
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
    title: 'all-group-title-likes',
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

          let title = i18n('all-group-likes-title-over-thousand', { thousand });

          if (!thousand) {
            if (hundred) {
              title = i18n('all-group-likes-title-over-hundred', {
                hundred: hundred * 100,
              });
            } else {
              title = i18n('all-group-likes-title-lower-hundred', {
                hundred: (hundred + 1) * 100,
              });
            }
          }
          return { title, items };
        });
    },
  },

  [RATING]: {
    title: 'all-group-title-rating',
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
    title: 'all-group-title-country',
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
    title: 'all-group-title-completeness',
    reducer(list) {
      return [
        {
          title: i18n('all-group-completeness-title'),
          items: sortTvShows(list.filter(({ status }) => +status)),
        },
      ];
    },
  },
};

if (user.isExtended()) {
  sections[UHD] = {
    title: 'all-group-title-uhd',
    reducer(list) {
      return [
        {
          title: i18n('all-group-uhd-title'),
          items: sortTvShows(list.filter(item => !!item['4k'])),
        },
      ];
    },
  };
}

export default function allRoute() {
  return TVDML.createPipeline().pipe(
    TVDML.render(
      TVDML.createComponent({
        getInitialState() {
          const token = user.getToken();

          return {
            token,
            loading: true,
            groupId: NAME,
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
          return Promise.all([getAllTVShows(), getCountriesList()]).then(
            ([series, contries]) => ({ series, contries }),
          );
        },

        render() {
          if (this.state.loading) {
            return <Loader />;
          }

          const { series, groupId, contries } = this.state;

          const { title: titleCode, reducer } = sections[groupId];
          const groups = reducer(series, { contries });
          const title = i18n(titleCode);

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
                        {i18n('all-group-by-title', { title })}{' '}
                        <badge
                          width="31"
                          height="14"
                          class="dropdown-badge"
                          src="resource://button-dropdown"
                        />
                      </text>
                    </button>
                  </separator>
                  {groups.map(({ title: groupTitle, items }) => (
                    <grid key={groupTitle}>
                      <header>
                        <title>{groupTitle}</title>
                      </header>
                      <section>
                        {items.map(tvshow => {
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
                    </grid>
                  ))}
                </collectionList>
              </stackTemplate>
            </document>
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
                <title>{i18n('all-group-by')}</title>
                {sectionsList.map(({ id, title: titleCode }) => (
                  <button
                    key={id}
                    autoHighlight={id === this.state.groupId || undefined}
                    // eslint-disable-next-line react/jsx-no-bind
                    onSelect={this.onGroupSelect.bind(this, id)}
                  >
                    <text>{i18n(titleCode)}</text>
                  </button>
                ))}
              </alertTemplate>
            </document>,
          ).sink();
        },

        onGroupSelect(groupId) {
          this.setState({ groupId });
          TVDML.removeModal();
        },
      }),
    ),
  );
}
