/* global Player Playlist MediaItem */

import * as TVDML from 'tvdml';
import formatNumber from 'simple-format-number';

import * as user from '../user';

import {
  link,
  isMenuButtonPressNavigatedTo,
  movieIsUHD,
  movieHasCC,
  movieIsHD,
} from '../utils';
import { deepEqualShouldUpdate } from '../utils/components';

import { get as i18n } from '../localization';

import {
  getMovieDescription,
  addMovieToFavorite,
  removeMovieFromFavorite,
  markMovieAsWatched,
  markMovieAsUnwatched,
  rateMovie,
  saveMovieTime,
  getFranchiseMovies,
} from '../request/soap';

import Tile from '../components/tile';
import Loader from '../components/loader';

const MARK_AS_WATCHED_PERCENTAGE = 90;

export default function movieRoute() {
  return TVDML.createPipeline()
    .pipe(
      TVDML.passthrough(({ navigation: { id, title, poster } }) => ({
        id,
        title,
        poster,
      })),
    )
    .pipe(
      TVDML.render(
        TVDML.createComponent({
          getInitialState() {
            const extended = user.isExtended();
            const authorized = user.isAuthorized();

            return {
              likes: 0,
              extended,
              authorized,
              loading: true,
            };
          },

          componentDidMount() {
            const setState = this.setState.bind(this);

            // eslint-disable-next-line no-underscore-dangle
            const currentDocument = this._rootNode.ownerDocument;

            this.menuButtonPressStream = TVDML.subscribe('menu-button-press');
            this.menuButtonPressStream
              .pipe(isMenuButtonPressNavigatedTo(currentDocument))
              .pipe(
                isNavigated => isNavigated && this.loadData().then(setState),
              );

            this.userStateChangeStream = user.subscription();
            this.userStateChangeStream.pipe(() =>
              this.setState({
                extended: user.isExtended(),
                authorized: user.isAuthorized(),
              }),
            );

            this.appResumeStream = TVDML.subscribe(TVDML.event.RESUME);
            this.appResumeStream.pipe(() => this.loadData().then(setState));

            // To improuve UX on fast request we are adding rendering timeout.
            const waitForAnimations = new Promise(done =>
              setTimeout(done, 500),
            );

            Promise.all([this.loadData(), waitForAnimations]).then(
              ([payload]) => {
                this.setState({ loading: false, ...payload });
              },
            );
          },

          componentWillUnmount() {
            this.menuButtonPressStream.unsubscribe();
            this.userStateChangeStream.unsubscribe();
            this.appResumeStream.unsubscribe();
          },

          shouldComponentUpdate: deepEqualShouldUpdate,

          loadData() {
            const { id } = this.props;

            return getMovieDescription(id).then(movie =>
              (movie.franchise
                ? getFranchiseMovies(movie.franchise)
                : Promise.resolve([])
              ).then(franchiseMovies => ({
                movie,
                franchiseMovies,
                likes: +movie.likes,
              })),
            );
          },

          render() {
            if (this.state.loading) {
              return (
                <Loader title={this.props.title} heroImg={this.props.poster} />
              );
            }

            return (
              <document>
                <head>
                  <style
                    content={`
                      .rating_card {
                        padding: 10 22;
                      }

                      @media tv-template and (tv-theme:dark) {
                        .badge {
                          tv-tint-color: rgb(255, 255, 255);
                        }
                      }
                    `}
                  />
                </head>
                <productTemplate>
                  <banner>
                    {this.renderStatus()}
                    {this.renderInfo()}
                    <heroImg src={this.state.movie.covers.big} />
                  </banner>
                  {this.renderFranchise()}
                  {this.renderRatings()}
                  {this.renderCrew()}
                  {this.renderAdditionalInfo()}
                </productTemplate>
              </document>
            );
          },

          renderStatus() {
            const { genres, actors, directors } = this.state.movie;

            return (
              <infoList>
                <info>
                  <header>
                    <title>{i18n('movie-genres')}</title>
                  </header>
                  {genres.map(item => (
                    <text key={item.url_name}>{item.name}</text>
                  ))}
                </info>
                {directors.length && (
                  <info>
                    <header>
                      <title>{i18n('movie-directors')}</title>
                    </header>
                    {directors.map(item => (
                      <text key={item.url_name}>{item.name}</text>
                    ))}
                  </info>
                )}
                {actors.length && (
                  <info>
                    <header>
                      <title>{i18n('movie-actors')}</title>
                    </header>
                    {actors.map(item => (
                      <text key={item.url_name}>{item.name}</text>
                    ))}
                  </info>
                )}
              </infoList>
            );
          },

          renderInfo() {
            const { likes, movie } = this.state;

            const watchBtn = (
              <buttonLockup onPlay={this.onWatch} onSelect={this.onWatch}>
                <badge src="resource://button-play" />
                <title>{i18n('movie-control-watch')}</title>
              </buttonLockup>
            );

            const markAsWatchedBtn = (
              <buttonLockup onSelect={this.onMarkAsWatched}>
                <badge src="resource://button-checkmark" />
                <title>{i18n('movie-control-mark-as-watched')}</title>
              </buttonLockup>
            );

            const addToFavoriteBtn = (
              <buttonLockup onSelect={this.onAddToFavorite}>
                <badge src="resource://button-add" />
                <title>{i18n('movie-control-favorite')}</title>
              </buttonLockup>
            );

            const removeFromFavoriteBtn = (
              <buttonLockup onSelect={this.onRemoveFromFavorite}>
                <badge src="resource://button-remove" />
                <title>{i18n('movie-control-unfavorite')}</title>
              </buttonLockup>
            );

            const rateBtn = (
              <buttonLockup onSelect={this.onRate}>
                <badge src="resource://button-rate" />
                <title>{i18n('movie-control-rate')}</title>
              </buttonLockup>
            );

            const moreBtn = (
              <buttonLockup onSelect={this.onMore}>
                <badge src="resource://button-more" />
                <title>{i18n('movie-control-more')}</title>
              </buttonLockup>
            );

            let buttons = <row />;

            if (this.state.authorized) {
              buttons = (
                <row>
                  {watchBtn}
                  {!movie.watched && markAsWatchedBtn}
                  {rateBtn}
                  {movie.liked ? removeFromFavoriteBtn : addToFavoriteBtn}
                  {movie.watched && moreBtn}
                </row>
              );
            }

            return (
              <stack>
                <title>{i18n('movie-title', movie)}</title>
                <row>
                  <text>{movie.year}</text>
                  <text>{i18n('movie-runtime', movie)}</text>
                  {movieIsUHD(movie) ? (
                    <badge class="badge" src="resource://4k" />
                  ) : (
                    movieIsHD(movie) && (
                      <badge class="badge" src="resource://hd" />
                    )
                  )}
                  {movieHasCC(movie) && (
                    <badge class="badge" src="resource://cc" />
                  )}
                  <ratingBadge value={movie.soap_rating / 10} />
                  <text>
                    {i18n('movie-liked-by')}{' '}
                    {likes > 0
                      ? i18n('movie-liked-by-people', { likes })
                      : i18n('movie-liked-by-no-one')}
                  </text>
                </row>
                <description
                  handlesOverflow="true"
                  onSelect={this.onShowFullDescription}
                >
                  {i18n('movie-description', movie)}
                </description>
                {buttons}
              </stack>
            );
          },

          renderFranchise() {
            const { movie, franchiseMovies } = this.state;
            if (!franchiseMovies.length) return null;

            return (
              <shelf>
                <header>
                  <title>{i18n('movie-franchise-title', movie)}</title>
                </header>
                <section>
                  {franchiseMovies.map(item => {
                    const {
                      id,
                      covers: { big: poster },
                    } = item;

                    const isUHD = !!item['4k'];
                    const title = i18n('movie-title', item);

                    return (
                      <Tile
                        key={id}
                        title={title}
                        poster={poster}
                        route="movie"
                        isUHD={isUHD}
                        payload={{ id, title, poster }}
                      />
                    );
                  })}
                </section>
              </shelf>
            );
          },

          renderRatings() {
            const {
              soap_votes: soapVotes,
              soap_rating: soapRating,
              imdb_votes: imdbVotes,
              imdb_rating: imdbRating,
              kinopoisk_votes: kinopoiskVotes,
              kinopoisk_rating: kinopoiskRating,
            } = this.state.movie;

            return (
              <shelf>
                <header>
                  <title>{i18n('movie-ratings')}</title>
                </header>
                <section>
                  {!!+imdbRating && (
                    <ratingCard class="rating_card">
                      <title>{`${imdbRating}`.slice(0, 3)} / 10</title>
                      <text>{i18n('movie-imdb-title')}</text>
                      <ratingBadge value={imdbRating / 10} />
                      <description>
                        {i18n('movie-average-imdb', {
                          amount: formatNumber(+imdbVotes, {
                            fractionDigits: 0,
                          }),
                        })}
                      </description>
                    </ratingCard>
                  )}
                  {!!+kinopoiskRating && (
                    <ratingCard class="rating_card">
                      <title>{`${kinopoiskRating}`.slice(0, 3)} / 10</title>
                      <text>{i18n('movie-kinopoisk-title')}</text>
                      <ratingBadge value={kinopoiskRating / 10} />
                      <description>
                        {i18n('movie-average-kinopoisk', {
                          amount: formatNumber(+kinopoiskVotes, {
                            fractionDigits: 0,
                          }),
                        })}
                      </description>
                    </ratingCard>
                  )}
                  {!!+soapRating && (
                    <ratingCard class="rating_card">
                      <title>{`${soapRating}`.slice(0, 3)} / 10</title>
                      <text>{i18n('movie-soap-title')}</text>
                      <ratingBadge value={soapRating / 10} />
                      <description>
                        {i18n('movie-average-soap', {
                          amount: formatNumber(+soapVotes, {
                            fractionDigits: 0,
                          }),
                        })}
                      </description>
                    </ratingCard>
                  )}
                </section>
              </shelf>
            );
          },

          renderCrew() {
            const { movie } = this.state;

            const crew = [
              ...movie.directors.map(director => ({
                ...director,
                role: 'director',
              })),
              ...movie.writers.map(director => ({
                ...director,
                role: 'writer',
              })),
              ...movie.actors.map(director => ({
                ...director,
                role: 'actor',
              })),
            ];

            if (!crew.length) return null;

            return (
              <shelf>
                <header>
                  <title>{i18n('movie-cast-crew')}</title>
                </header>
                <section>
                  {crew.map(item => {
                    const [firstName, lastName] = item.name.split(' ');

                    return (
                      <monogramLockup
                        key={item.url_name}
                        onSelect={link(`movie-${item.role}`, {
                          id: item.url_name,
                          name: item.name,
                        })}
                      >
                        <monogram
                          style="tv-placeholder: monogram;"
                          firstName={firstName}
                          lastName={lastName}
                        />
                        <title>{item.name}</title>
                        <subtitle>
                          {i18n('movie-cast-crew-role', item)}
                        </subtitle>
                      </monogramLockup>
                    );
                  })}
                </section>
              </shelf>
            );
          },

          renderAdditionalInfo() {
            const { movie } = this.state;

            return (
              <productInfo>
                <infoTable>
                  <header>
                    <title>{i18n('movie-information')}</title>
                  </header>
                  <info>
                    <header>
                      <title>{i18n('movie-information-year')}</title>
                    </header>
                    <text>{movie.year}</text>
                  </info>
                  <info>
                    <header>
                      <title>{i18n('movie-information-runtime')}</title>
                    </header>
                    <text>{i18n('movie-runtime', movie)}</text>
                  </info>
                  <info>
                    <header>
                      <title>{i18n('movie-information-country')}</title>
                    </header>
                    <text>{movie.countries}</text>
                  </info>
                  <info>
                    <header>
                      <title>{i18n('movie-information-budget')}</title>
                    </header>
                    <text>{movie.budget}</text>
                  </info>
                  <info>
                    <header>
                      <title>{i18n('movie-information-gross_worldwide')}</title>
                    </header>
                    <text>{movie.gross_worldwide}</text>
                  </info>
                </infoTable>
                <infoTable>
                  <header>
                    <title>{i18n('movie-information-languages')}</title>
                  </header>
                  <info>
                    <header>
                      <title>
                        {i18n('movie-information-languages-primary')}
                      </title>
                    </header>
                    <text>
                      {i18n('movie-information-languages-primary-values')}
                    </text>
                  </info>
                </infoTable>
              </productInfo>
            );
          },

          onShowFullDescription() {
            const { movie } = this.state;

            TVDML.renderModal(
              <document>
                <descriptiveAlertTemplate>
                  <title>{i18n('movie-title', movie)}</title>
                  <description>{i18n('movie-description', movie)}</description>
                </descriptiveAlertTemplate>
              </document>,
            ).sink();
          },

          onWatch() {
            const { movie } = this.state;

            const player = new Player();

            player.addEventListener(
              'timeDidChange',
              ({ time }) => {
                const { currentMediaItem, currentMediaItemDuration } = player;

                currentMediaItem.currentTime = time;

                if (!currentMediaItem.duration) {
                  currentMediaItem.duration = currentMediaItemDuration;
                }

                const watchedPercent = (time * 100) / currentMediaItemDuration;
                const passedBoundary =
                  watchedPercent >= MARK_AS_WATCHED_PERCENTAGE;

                if (passedBoundary && !currentMediaItem.markedAsWatched) {
                  currentMediaItem.markedAsWatched = true;
                  this.onMarkAsWatched();
                }
              },
              { interval: 1 },
            );

            player.addEventListener('stateWillChange', event => {
              const { currentMediaItem } = player;
              const isEnded = event.state === 'end';
              const isPaused = event.state === 'paused';
              const isProperState = isEnded || isPaused;
              const shouldSaveTime =
                currentMediaItem &&
                !currentMediaItem.markedAsWatched &&
                isProperState;

              if (shouldSaveTime) {
                const { id, currentTime } = currentMediaItem;

                saveMovieTime(id, currentTime).then(() => {
                  this.setState({
                    movie: {
                      ...this.state.movie,
                      start_from: currentTime,
                    },
                  });
                });
              }
            });

            const video = new MediaItem('video');
            video.id = movie.id;
            video.url = movie.stream_url;
            video.resumeTime = movie.start_from;
            video.title = i18n('movie-title', movie);
            video.description = i18n('movie-description', movie);
            video.artworkImageURL = movie.covers.big;

            player.playlist = new Playlist();
            player.playlist.push(video);

            player.play();
          },

          onRate() {
            const { title } = this.props;

            TVDML.renderModal(
              <document>
                <ratingTemplate>
                  <title>{title}</title>
                  <ratingBadge onChange={this.onRateChange} />
                </ratingTemplate>
              </document>,
            ).sink();
          },

          onRateChange(event) {
            return this.onRateMovie(event.value * 10);
          },

          onRateMovie(rating) {
            const { id } = this.props;

            return rateMovie(id, rating)
              .then(({ votes: soap_votes, rating: soap_rating }) => ({
                soap_votes,
                soap_rating,
              }))
              .then(processedRating =>
                this.setState({
                  movie: {
                    ...this.state.movie,
                    ...processedRating,
                  },
                }),
              )
              .then(TVDML.removeModal);
          },

          onMore() {
            const onMarkAsUnwatched = () =>
              this.onMarkAsUnwatched().then(TVDML.removeModal);

            TVDML.renderModal(
              <document>
                <alertTemplate>
                  <title>{i18n('movie-title-more')}</title>
                  <button onSelect={onMarkAsUnwatched}>
                    <text>{i18n('movie-mark-as-unwatched')}</text>
                  </button>
                </alertTemplate>
              </document>,
            ).sink();
          },

          onMarkAsWatched() {
            const { id } = this.props;

            return markMovieAsWatched(id)
              .then(this.loadData.bind(this))
              .then(this.setState.bind(this));
          },

          onMarkAsUnwatched() {
            const { id } = this.props;

            return markMovieAsUnwatched(id)
              .then(this.loadData.bind(this))
              .then(this.setState.bind(this));
          },

          onAddToFavorite() {
            const { id } = this.props;

            return addMovieToFavorite(id)
              .then(this.loadData.bind(this))
              .then(this.setState.bind(this));
          },

          onRemoveFromFavorite() {
            const { id } = this.props;

            return removeMovieFromFavorite(id)
              .then(this.loadData.bind(this))
              .then(this.setState.bind(this));
          },
        }),
      ),
    );
}
