import * as TVDML from 'tvdml';

import * as user from '../user';
import { get as i18n } from '../localization';

import { getAllMovies, getCountriesList } from '../request/soap';

import { isMenuButtonPressNavigatedTo, movieIsUHD, sortMovies } from '../utils';
import { deepEqualShouldUpdate } from '../utils/components';

import Tile from '../components/tile';
import Loader from '../components/loader';

const NAME = 'name';
const DATE = 'date';
const LIKES = 'likes';
const RATING = 'rating';
const COUNTRY = 'country';
const FAVORITE = 'favorite';
const FRANCHISE = 'franchise';

const sections = {
  [NAME]: {
    title: 'movies-group-title-name',
    reducer(list) {
      return [
        {
          title: i18n('movies-group-name-title'),
          items: sortMovies(list),
        },
      ];
    },
  },

  [DATE]: {
    title: 'movies-group-title-date',
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
          items: sortMovies(collection[year]),
        }));
    },
  },

  [LIKES]: {
    title: 'movies-group-title-likes',
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

          let title = i18n('movies-group-likes-title-over-thousand', {
            thousand,
          });

          if (!thousand) {
            if (hundred) {
              title = i18n('movies-group-likes-title-over-hundred', {
                hundred: hundred * 100,
              });
            } else {
              title = i18n('movies-group-likes-title-lower-hundred', {
                hundred: (hundred + 1) * 100,
              });
            }
          }
          return { title, items };
        });
    },
  },

  [RATING]: {
    title: 'movies-group-title-rating',
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
          items: sortMovies(collection[rating]),
        }));
    },
  },

  [FRANCHISE]: {
    title: 'movies-group-title-franchise',
    reducer(list) {
      const collection = list.reduce((result, item) => {
        if (!item.franchise) return result;

        // eslint-disable-next-line no-param-reassign
        if (!result[item.franchise]) result[item.franchise] = [];
        result[item.franchise].push(item);
        return result;
      }, {});

      return Object.keys(collection)
        .sort((a, b) => a.localeCompare(b))
        .map(franchise => ({
          title: franchise,
          items: sortMovies(collection[franchise]),
        }));
    },
  },

  [COUNTRY]: {
    title: 'movies-group-title-country',
    reducer(list, { contries }) {
      const collection = list.reduce((result, item) => {
        item.countries.split(', ').forEach(country => {
          // eslint-disable-next-line no-param-reassign
          if (!result[country]) result[country] = [];
          result[country].push(item);
        });

        return result;
      }, {});

      return contries
        .filter(country => collection[country.short])
        .map(country => ({
          title: country.full,
          items: sortMovies(collection[country.short]),
        }));
    },
  },

  [FAVORITE]: {
    title: 'movies-group-title-favorite',
    reducer(list) {
      return [
        {
          title: i18n('movies-group-name-title'),
          items: sortMovies(list).filter(item => item.liked),
        },
      ];
    },
  },
};

export default function moviesRoute() {
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
          return Promise.all([getAllMovies(), getCountriesList()]).then(
            ([movies, contries]) => ({ movies, contries }),
          );
        },

        render() {
          if (this.state.loading) {
            return <Loader />;
          }

          const { movies, groupId, contries } = this.state;

          const { title: titleCode, reducer } = sections[groupId];
          const groups = reducer(movies, { contries });
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
                        {i18n('movies-group-by-title', { title })}{' '}
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
                        {items.map(movie => {
                          const {
                            id,
                            watched,
                            covers: { big: poster },
                          } = movie;

                          const movieTitle = i18n('movie-title', movie);

                          return (
                            <Tile
                              key={id}
                              title={movieTitle}
                              route="movie"
                              poster={poster}
                              isWatched={watched}
                              isUHD={movieIsUHD(movie)}
                              payload={{
                                id,
                                poster,
                                title: movieTitle,
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
                <title>{i18n('movies-group-by')}</title>
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
