import * as TVDML from 'tvdml';

import * as user from '../user';
import {get as i18n} from '../localization';

import {
  getGenresList,
  getTVShowsByGenre,
} from '../request/soap';

import {
  genreToId,
  capitalizeText,
  isMenuButtonPressNavigatedTo,
} from '../utils';

import {deepEqualShouldUpdate} from '../utils/components';

import Tile from '../components/tile';
import Loader from '../components/loader';

const {Promise} = TVDML;

export default function() {
  return TVDML
    .createPipeline()
    .pipe(TVDML.render(TVDML.createComponent({
      getInitialState() {
        const token = user.getToken();

        return {
          token,
          genres: [],
          active: null,
          loading: true,
          updated_genres: [],
          updating: false,
        };
      },

      componentDidMount() {
        const currentDocument = this._rootNode.ownerDocument;

        this.menuButtonPressStream = TVDML.subscribe('menu-button-press');
        this.menuButtonPressStream
          .pipe(isMenuButtonPressNavigatedTo(currentDocument))
          .pipe(isNavigated => {
            if (isNavigated) {
              this.setState({updated_genres: []});
              this.onGenreSelect(this.state.active);
            }
          });

        this.userStateChangeStream = user.subscription();
        this.userStateChangeStream.pipe(() => {
          const token = user.getToken();

          if (token !== this.state.token) {
            this.setState({updating: true, token});
          }
        });

        this.loadData().then(payload => {
          this.setState({loading: false, ...payload});
        });
      },

      componentWillReceiveProps(nextProps) {
        this.setState({updating: true});
      },

      componentDidUpdate(prevProps, prevState) {
        if (this.state.updating && prevState.updating !== this.state.updating) {
          this.loadData().then(payload => {
            this.setState({updating: false, ...payload});
          });
        }
      },

      componentWillUnmount() {
        this.menuButtonPressStream.unsubscribe();
        this.userStateChangeStream.unsubscribe();
      },

      shouldComponentUpdate: deepEqualShouldUpdate,

      loadData() {
        return getGenresList().then(genres => ({genres}));
      },

      render() {
        const {
          genres,
          loading,
        } = this.state;

        if (loading) {
          return <Loader />;
        }

        return (
          <document>
            <head>
              <style content={`
                @media tv-template and (tv-theme:dark) {
                  .tile-title {
                    color: rgb(152, 151, 152);
                  }
                }
              `} />
            </head>
            <catalogTemplate>
              <banner>
                <title>
                  {i18n('genres-caption')}
                </title>
              </banner>
              <list>
                <section>
                  {genres.map(genre => {
                    const id = genreToId(genre);
                    const tvshows = this.state[id];

                    return (
                      <listItemLockup
                        key={genre}
                        onHighlight={this.onGenreSelect.bind(this, genre)}
                      >
                        <title>
                          {capitalizeText(genre)}
                        </title>
                        <decorationLabel>
                          {tvshows ? tvshows.length : '…'}
                        </decorationLabel>
                        <relatedContent>
                          {tvshows == null ? (
                            <activityIndicator />
                          ) : (
                            <grid>
                              <section>
                                {tvshows.map(tvshow => {
                                  const {
                                    sid,
                                    watching,
                                    unwatched,
                                    covers: {big: poster},
                                  } = tvshow;

                                  const title = i18n('tvshow-title', tvshow);

                                  return (
                                    <Tile
                                      key={sid}
                                      title={title}
                                      route="tvshow"
                                      poster={poster}
                                      counter={unwatched}
                                      isWatched={watching > 0 && !unwatched}
                                      payload={{title, sid, poster}}
                                    />
                                  );
                                })}
                              </section>
                            </grid>
                          )}
                        </relatedContent>
                      </listItemLockup>
                    );
                  })}
                </section>
              </list>
            </catalogTemplate>
          </document>
        );
      },

      onGenreSelect(genre) {
        const id = genreToId(genre);
        const {updated_genres} = this.state;

        this.setState({active: genre});
        if (~updated_genres.indexOf(id)) return;
        getTVShowsByGenre(genre).then(tvshows => this.setState({
          [id]: tvshows,
          updated_genres: updated_genres.concat(id),
        }));
      },
    })));
}
