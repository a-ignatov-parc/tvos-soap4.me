import * as TVDML from 'tvdml';

import * as user from '../user';
import { get as i18n } from '../localization';

import { getMyRecommendations, getGenresList } from '../request/soap';
import {
  isMenuButtonPressNavigatedTo,
  capitalizeText,
  sortTvShows,
} from '../utils';
import { deepEqualShouldUpdate } from '../utils/components';

import Tile from '../components/tile';
import Loader from '../components/loader';

import commonStyles from '../common/styles';

export default function myRecomendations() {
  return TVDML.createPipeline().pipe(
    TVDML.render(
      TVDML.createComponent({
        getInitialState() {
          const token = user.getToken();
          const authorized = user.isAuthorized();

          return {
            token,
            authorized,
            updating: false,
            loading: !!authorized,
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

          this.appResumeStream = TVDML.subscribe(TVDML.event.RESUME);
          this.appResumeStream.pipe(() => this.loadData().then(setState));

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
          this.appResumeStream.unsubscribe();
        },

        shouldComponentUpdate: deepEqualShouldUpdate,

        loadData() {
          if (!user.isAuthorized()) {
            return Promise.resolve({});
          }

          return Promise.all([getMyRecommendations(), getGenresList()]).then(
            ([recomendations, genres]) => ({
              recomendations,
              genres,
            }),
          );
        },

        render() {
          const { loading, recomendations, genres } = this.state;

          if (loading) {
            return <Loader />;
          }

          if (!recomendations) {
            return (
              <document>
                <head>{commonStyles}</head>
                <alertTemplate>
                  <title class="grey_text">
                    {i18n('my-empty-recomendations')}
                  </title>
                </alertTemplate>
              </document>
            );
          }

          const groupedRecomendations = recomendations.reduce(
            (result, recomendation) => {
              recomendation.genres.flat().forEach(genre => {
                if (!result[genre]) result[genre] = [];
                result[genre].push(recomendation);
              });

              return result;
            },
            {},
          );

          const sortedRecomendationsByGroup = genres
            .map(genre =>
              groupedRecomendations[genre]
                ? [genre, groupedRecomendations[genre]]
                : undefined,
            )
            .filter(Boolean);

          return (
            <document>
              <head>
                <style
                  content={`
                  @media tv-template and (tv-theme:dark) {
                    .tile-title {
                      color: rgb(152, 151, 152);
                    }
                  }
                `}
                />
              </head>
              <catalogTemplate>
                <banner>
                  <title>{i18n('my-recomendations')}</title>
                </banner>
                <list>
                  <section>
                    {sortedRecomendationsByGroup.map(([genre, tvshows]) => (
                      <listItemLockup key={genre}>
                        <title>{capitalizeText(genre)}</title>
                        <decorationLabel>{tvshows.length}</decorationLabel>
                        <relatedContent>
                          <grid>
                            <section>
                              {sortTvShows(tvshows).map(tvshow => {
                                const {
                                  id,
                                  covers: { big: poster },
                                } = tvshow;

                                const tvShowTitle = i18n(
                                  'tvshow-title',
                                  tvshow,
                                );

                                return (
                                  <Tile
                                    key={id}
                                    title={tvShowTitle}
                                    route="tvshow"
                                    poster={poster}
                                    payload={{
                                      sid: id,
                                      poster,
                                      title: tvShowTitle,
                                    }}
                                  />
                                );
                              })}
                            </section>
                          </grid>
                        </relatedContent>
                      </listItemLockup>
                    ))}
                  </section>
                </list>
              </catalogTemplate>
            </document>
          );
        },
      }),
    ),
  );
}
