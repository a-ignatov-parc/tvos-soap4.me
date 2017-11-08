/* global Player Playlist */

import moment from 'moment';
import * as TVDML from 'tvdml';
import formatNumber from 'simple-format-number';

import * as user from '../user';
import { processFamilyAccount } from '../user/utils';

import * as settings from '../settings';

import authFactory from '../helpers/auth';
import { defaultErrorHandlers } from '../helpers/auth/handlers';

import {
  link,
  capitalizeText,
  createMediaItem,
  getMonogramImageUrl,
  isMenuButtonPressNavigatedTo,
} from '../utils';

import { processEntitiesInString } from '../utils/parser';
import { deepEqualShouldUpdate } from '../utils/components';

import { get as i18n } from '../localization';

import {
  TVShowStatuses,
  TVShowStatusStrings,
  getEpisodeMedia,
  getTrailerStream,
  getCountriesList,
  getTVShowSeasons,
  getTVShowReviews,
  getTVShowTrailers,
  getTVShowSchedule,
  getTVShowDescription,
  getTVShowRecommendations,
  markTVShowAsWatched,
  markTVShowAsUnwatched,
  markSeasonAsWatched,
  markSeasonAsUnwatched,
  markReviewAsLiked,
  markReviewAsDisliked,
  addToMyTVShows,
  removeFromMyTVShows,
  rateTVShow,
  mediaQualities,
} from '../request/soap';

import Tile from '../components/tile';
import Loader from '../components/loader';
import Authorize from '../components/authorize';

const { VIDEO_QUALITY } = settings.params;
const { UHD } = settings.values[VIDEO_QUALITY];

function calculateUnwatchedCount(season) {
  return season.unwatched || 0;
}

function getTrailerItem(trailer) {
  const { tid } = getEpisodeMedia(trailer);

  return getTrailerStream(tid).then(({ stream }) => ({
    id: tid,
    url: stream,
  }));
}

export default function tvShowRoute() {
  return TVDML
    .createPipeline()
    .pipe(TVDML.passthrough(({
      navigation: {
        sid,
        title,
        poster,
      },
    }) => ({ sid, title, poster })))
    .pipe(TVDML.render(TVDML.createComponent({
      getInitialState() {
        const extended = user.isExtended();
        const authorized = user.isAuthorized();

        return {
          likes: 0,
          extended,
          authorized,
          loading: true,
          watching: false,
          continueWatching: false,
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
        this.userStateChangeStream.pipe(() => this.setState({
          extended: user.isExtended(),
          authorized: user.isAuthorized(),
        }));

        this.appResumeStream = TVDML.subscribe(TVDML.event.RESUME);
        this.appResumeStream.pipe(() => this.loadData().then(setState));

        // To improuve UX on fast request we are adding rendering timeout.
        const waitForAnimations = new Promise(done => setTimeout(done, 500));

        Promise
          .all([this.loadData(), waitForAnimations])
          .then(([payload]) => this.setState({ loading: false, ...payload }));
      },

      componentWillUnmount() {
        this.menuButtonPressStream.unsubscribe();
        this.userStateChangeStream.unsubscribe();
        this.appResumeStream.unsubscribe();
      },

      shouldComponentUpdate: deepEqualShouldUpdate,

      loadData() {
        const { sid } = this.props;

        return Promise
          .all([
            getCountriesList(),
            getTVShowSeasons(sid),
            getTVShowSchedule(sid),
            getTVShowDescription(sid),
            getTVShowRecommendations(sid),
          ])
          .then(payload => {
            const [
              contries,
              seasons,
              schedule,
              tvshow,
              recomendations,
            ] = payload;

            return Promise
              .all([
                tvshow.reviews > 0 ? getTVShowReviews(sid) : [],
                tvshow.trailers > 0 ? getTVShowTrailers(sid) : [],
              ])
              .then(([reviews, trailers]) => ({
                tvshow,
                reviews,
                seasons,
                schedule,
                trailers,
                contries,
                recomendations,
              }));
          })
          .then(payload => ({
            likes: +payload.tvshow.likes,
            watching: payload.tvshow.watching > 0,
            continueWatching: !!this.getSeasonToWatch(payload.seasons),
            ...payload,
          }));
      },

      render() {
        if (this.state.loading) {
          return (
            <Loader
              title={this.props.title}
              heroImg={this.props.poster}
            />
          );
        }

        return (
          <document>
            <productTemplate>
              <banner>
                {this.renderStatus()}
                {this.renderInfo()}
                <heroImg src={this.state.tvshow.covers.big} />
              </banner>
              {this.renderSeasons()}
              {this.renderRecomendations()}
              {this.renderRatings()}
              {this.renderCrew()}
              {this.renderAdditionalInfo()}
            </productTemplate>
          </document>
        );
      },

      renderStatus() {
        const {
          status,
          genres,
          actors,
        } = this.state.tvshow;

        return (
          <infoList>
            <info>
              <header>
                <title>
                  {i18n('tvshow-status')}
                </title>
              </header>
              <text>
                {i18n(TVShowStatusStrings[TVShowStatuses[status]])}
              </text>
            </info>
            <info>
              <header>
                <title>
                  {i18n('tvshow-genres')}
                </title>
              </header>
              {genres.map(capitalizeText).map(genre => (
                <text key={genre}>{genre}</text>
              ))}
            </info>
            {actors.length && (
              <info>
                <header>
                  <title>
                    {i18n('tvshow-actors')}
                  </title>
                </header>
                {actors.map(({ person_en: personName }) => (
                  <text key={personName}>{personName}</text>
                ))}
              </info>
            )}
          </infoList>
        );
      },

      renderInfo() {
        const {
          likes,
          extended,
        } = this.state;

        const {
          description,
          soap_rating: soapRating,
        } = this.state.tvshow;

        const title = i18n('tvshow-title', this.state.tvshow);
        const hasTrailers = !!this.state.trailers.length;
        const hasMultipleTrailers = this.state.trailers.length > 1;

        let buttons = <row />;

        const continueWatchingBtn = (
          <buttonLockup
            onPlay={this.onContinueWatchingAndPlay}
            onSelect={this.onContinueWatching}
          >
            <badge src="resource://button-play" />
            <title>
              {i18n('tvshow-control-continue-watching')}
            </title>
          </buttonLockup>
        );

        const trailerBtnTitleCode = hasMultipleTrailers
          ? 'tvshow-control-show-trailers'
          : 'tvshow-control-show-trailer';

        const showTrailerBtn = (
          <buttonLockup
            onPlay={this.onShowFirstTrailer}
            onSelect={this.onShowTrailer}
          >
            <badge src="resource://button-preview" />
            <title>
              {i18n(trailerBtnTitleCode)}
            </title>
          </buttonLockup>
        );

        const startWatchingBtn = (
          <buttonLockup onSelect={this.onAddToSubscriptions}>
            <badge src="resource://button-add" />
            <title>
              {i18n('tvshow-control-start-watching')}
            </title>
          </buttonLockup>
        );

        const stopWatchingBtn = (
          <buttonLockup onSelect={this.onRemoveFromSubscription}>
            <badge src="resource://button-remove" />
            <title>
              {i18n('tvshow-control-stop-watching')}
            </title>
          </buttonLockup>
        );

        const moreBtn = (
          <buttonLockup onSelect={this.onMore}>
            <badge src="resource://button-more" />
            <title>
              {i18n('tvshow-control-more')}
            </title>
          </buttonLockup>
        );

        const rateBtn = (
          <buttonLockup onSelect={this.onRate}>
            <badge src="resource://button-rate" />
            <title>
              {i18n('tvshow-control-rate')}
            </title>
          </buttonLockup>
        );

        if (this.state.watching) {
          buttons = (
            <row>
              {this.state.continueWatching && extended && continueWatchingBtn}
              {hasTrailers && showTrailerBtn}
              {this.state.authorized && stopWatchingBtn}
              {this.state.authorized && rateBtn}
              {this.state.authorized && moreBtn}
            </row>
          );
        } else {
          buttons = (
            <row>
              {hasTrailers && showTrailerBtn}
              {startWatchingBtn}
              {this.state.authorized && rateBtn}
              {this.state.authorized && moreBtn}
            </row>
          );
        }

        return (
          <stack>
            <title>{title}</title>
            <row>
              <ratingBadge value={soapRating / 10} />
              <text>
                {i18n('tvshow-liked-by')}
                {' '}
                {likes > 0
                  ? i18n('tvshow-liked-by-people', { likes })
                  : i18n('tvshow-liked-by-no-one')
                }
              </text>
            </row>
            <description
              handlesOverflow="true"
              onSelect={this.onShowFullDescription}
            >{description}</description>
            {buttons}
          </stack>
        );
      },

      renderSeasons() {
        const { sid, covers } = this.state.tvshow;
        const title = i18n('tvshow-title', this.state.tvshow);

        const scheduleDiff = this.state.schedule
          .slice(this.state.seasons.length)
          .map(season => ({
            covers,
            begins: season.episodes[0].date,
            ...season,
          }));

        const seasons = this.state.seasons.concat(scheduleDiff);

        const currentMoment = moment();

        const nextDay = currentMoment
          .clone()
          .add(moment.relativeTimeThreshold('h'), 'hour');

        const nextMonth = currentMoment
          .clone()
          .add(moment.relativeTimeThreshold('d'), 'day');

        if (!seasons.length) return null;

        return (
          <shelf>
            <header>
              <title>
                {i18n('tvshow-seasons')}
              </title>
            </header>
            <section>
              {seasons.map((season, i) => {
                const {
                  begins,
                  season: seasonNumber,
                  covers: { big: poster },
                } = season;

                const { schedule } = this.state;

                const seasonHasPoster = !!this.state.seasons[i];
                const seasonTitle = i18n('tvshow-season', { seasonNumber });
                const unwatched = calculateUnwatchedCount(season);

                const { episodes: seasonEpisodes } = season;
                const { episodes: scheduleEpisodes } = schedule[i] || {
                  episodes: [],
                };

                const [scheduleEpisode] = scheduleEpisodes
                  .slice(seasonEpisodes.length)
                  .filter(episode => {
                    const episodeDate = moment(episode.date, 'DD.MM.YYYY');
                    return episodeDate > currentMoment;
                  });

                const isUHD = seasonEpisodes
                  .map(({ files }) => files)
                  .filter(Boolean)
                  .some(files => files.some(({ quality }) => {
                    const mqCode = mediaQualities[quality];
                    return mqCode === UHD;
                  }));

                let isWatched = !unwatched;
                let dateTitle;
                let date;

                if (scheduleEpisode) {
                  date = moment(scheduleEpisode.date, 'DD.MM.YYYY');

                  if (!date.isValid() || nextMonth < date) {
                    dateTitle = i18n('new-episode-soon');
                  } else if (nextDay > date) {
                    dateTitle = i18n('new-episode-day');
                  } else {
                    dateTitle = i18n('new-episode-custom-date', {
                      date: date.fromNow(),
                    });
                  }
                  if (currentMoment < date) isWatched = false;
                }

                if (begins) {
                  date = moment(begins, 'DD.MM.YYYY');

                  if (!date.isValid() || nextMonth < date) {
                    dateTitle = i18n('new-season-soon');
                  } else if (nextDay > date) {
                    dateTitle = i18n('new-season-day');
                  } else {
                    dateTitle = i18n('new-season-custom-date', {
                      date: date.fromNow(),
                    });
                  }
                  isWatched = false;
                }

                const payload = {
                  sid,
                  poster,
                  id: seasonNumber,
                  title: `${title} — ${seasonTitle}`,
                };

                return (
                  <Tile
                    key={seasonNumber}
                    title={seasonTitle}
                    route="season"
                    poster={seasonHasPoster && poster}
                    counter={unwatched || dateTitle}
                    isWatched={isWatched}
                    isUHD={isUHD}
                    payload={payload}

                    // eslint-disable-next-line react/jsx-no-bind
                    onHoldselect={this.onSeasonOptions.bind(...[
                      this,
                      payload.id,
                      payload.title,
                      isWatched,
                    ])}
                  />
                );
              })}
            </section>
          </shelf>
        );
      },

      onSeasonOptions(id, title, isWatched) {
        TVDML
          .renderModal((
            <document>
              <alertTemplate>
                <title>
                  {title}
                </title>
                {isWatched ? (
                  <button
                    // eslint-disable-next-line react/jsx-no-bind
                    onSelect={this.onMarkSeasonAsUnwatched.bind(this, id)}
                  >
                    <text>
                      {i18n('season-mark-as-unwatched')}
                    </text>
                  </button>
                ) : (
                  <button
                    // eslint-disable-next-line react/jsx-no-bind
                    onSelect={this.onMarkSeasonAsWatched.bind(this, id)}
                  >
                    <text>
                      {i18n('season-mark-as-watched')}
                    </text>
                  </button>
                )}
              </alertTemplate>
            </document>
          ))
          .sink();
      },

      onMarkSeasonAsWatched(id) {
        const { sid } = this.state.tvshow;

        return markSeasonAsWatched(sid, id)
          .then(this.loadData.bind(this))
          .then(this.setState.bind(this))
          .then(TVDML.removeModal);
      },

      onMarkSeasonAsUnwatched(id) {
        const { sid } = this.state.tvshow;

        return markSeasonAsUnwatched(sid, id)
          .then(this.loadData.bind(this))
          .then(this.setState.bind(this))
          .then(TVDML.removeModal);
      },

      renderRecomendations() {
        if (!this.state.recomendations.length) return null;

        return (
          <shelf>
            <header>
              <title>
                {i18n('tvshow-also-watched')}
              </title>
            </header>
            <section>
              {this.state.recomendations.map(tvshow => {
                const {
                  sid,
                  covers: { big: poster },
                } = tvshow;

                const isUHD = !!tvshow['4k'];
                const title = i18n('tvshow-title', tvshow);

                return (
                  <Tile
                    key={sid}
                    title={title}
                    poster={poster}
                    route="tvshow"
                    isUHD={isUHD}
                    payload={{ sid, title, poster }}
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
        } = this.state.tvshow;

        return (
          <shelf>
            <header>
              <title>
                {i18n('tvshow-ratings')}
              </title>
            </header>
            <section>
              {!!+imdbRating && (
                <ratingCard>
                  <title>{(`${imdbRating}`).slice(0, 3)} / 10</title>
                  <ratingBadge value={imdbRating / 10} />
                  <description>
                    {i18n('tvshow-average-imdb', {
                      amount: formatNumber(+imdbVotes, {
                        fractionDigits: 0,
                      }),
                    })}
                  </description>
                </ratingCard>
              )}
              {!!+kinopoiskRating && (
                <ratingCard>
                  <title>{(`${kinopoiskRating}`).slice(0, 3)} / 10</title>
                  <ratingBadge value={kinopoiskRating / 10} />
                  <description>
                    {i18n('tvshow-average-kinopoisk', {
                      amount: formatNumber(+kinopoiskVotes, {
                        fractionDigits: 0,
                      }),
                    })}
                  </description>
                </ratingCard>
              )}
              {!!+soapRating && (
                <ratingCard>
                  <title>{(`${soapRating}`).slice(0, 3)} / 10</title>
                  <ratingBadge value={soapRating / 10} />
                  <description>
                    {i18n('tvshow-average-soap', {
                      amount: formatNumber(+soapVotes, {
                        fractionDigits: 0,
                      }),
                    })}
                  </description>
                </ratingCard>
              )}
              {this.state.reviews.map(review => {
                const {
                  id,
                  date,
                  text,
                  user: userName,
                  review_likes: likes,
                  review_dislikes: dislikes,
                } = review;

                return (
                  <reviewCard
                    // eslint-disable-next-line react/jsx-no-bind
                    onSelect={this.onShowFullReview.bind(this, review)}
                    key={id}
                  >
                    <title>{userName}</title>
                    <description>
                      {moment(date * 1000).format('lll')}
                      {'\n\n'}
                      {processEntitiesInString(text)}
                    </description>
                    <text>{likes} 👍 / {dislikes} 👎</text>
                  </reviewCard>
                );
              })}
            </section>
          </shelf>
        );
      },

      renderCrew() {
        if (!this.state.tvshow.actors.length) return null;

        return (
          <shelf>
            <header>
              <title>
                {i18n('tvshow-cast-crew')}
              </title>
            </header>
            <section>
              {this.state.tvshow.actors.map(actor => {
                const {
                  person_id: personId,
                  person_en: personName,
                  person_image_original: personImage,
                  character_en: characterName,
                  character_image_original: characterImage,
                } = actor;

                const [firstName, lastName] = personName.split(' ');
                const poster = personImage || characterImage;

                return (
                  <monogramLockup
                    key={personId}
                    onSelect={link('actor', {
                      id: personId,
                      actor: personName,
                      poster,
                    })}
                  >
                    <monogram
                      style="tv-placeholder: monogram;"
                      src={getMonogramImageUrl(poster)}
                      firstName={firstName}
                      lastName={lastName}
                    />
                    <title>{personName}</title>
                    <subtitle>{characterName}</subtitle>
                  </monogramLockup>
                );
              })}
            </section>
          </shelf>
        );
      },

      renderAdditionalInfo() {
        const {
          year,
          network,
          episode_runtime: episodeRuntime,
          country: countryCode,
        } = this.state.tvshow;

        const { contries } = this.state;

        const [{
          full: country,
        }] = contries.filter(({ short }) => short === countryCode);

        return (
          <productInfo>
            <infoTable>
              <header>
                <title>
                  {i18n('tvshow-information')}
                </title>
              </header>
              <info>
                <header>
                  <title>
                    {i18n('tvshow-information-year')}
                  </title>
                </header>
                <text>{year}</text>
              </info>
              <info>
                <header>
                  <title>
                    {i18n('tvshow-information-runtime')}
                  </title>
                </header>
                <text>
                  {moment.duration(+episodeRuntime, 'minutes').humanize()}
                </text>
              </info>
              <info>
                <header>
                  <title>
                    {i18n('tvshow-information-country')}
                  </title>
                </header>
                <text>{country}</text>
              </info>
              <info>
                <header>
                  <title>
                    {i18n('tvshow-information-network')}
                  </title>
                </header>
                <text>{network}</text>
              </info>
            </infoTable>
            <infoTable>
              <header>
                <title>
                  {i18n('tvshow-languages')}
                </title>
              </header>
              <info>
                <header>
                  <title>
                    {i18n('tvshow-languages-primary')}
                  </title>
                </header>
                <text>
                  {i18n('tvshow-languages-primary-values')}
                </text>
              </info>
            </infoTable>
          </productInfo>
        );
      },

      getSeasonToWatch(seasons = []) {
        return seasons.reduce((result, season) => {
          if (!result && calculateUnwatchedCount(season)) return season;
          return result;
        }, null);
      },

      onContinueWatchingAndPlay(event) {
        this.onContinueWatching(event, true);
      },

      onContinueWatching(event, shouldPlayImmediately) {
        const uncompletedSeason = this.getSeasonToWatch(this.state.seasons);
        const {
          season: seasonNumber,
          covers: { big: poster },
        } = uncompletedSeason;

        const seasonTitle = i18n('tvshow-season', { seasonNumber });
        const title = i18n('tvshow-title', this.state.tvshow);
        const { sid } = this.state.tvshow;

        TVDML.navigate('season', {
          sid,
          poster,
          id: seasonNumber,
          title: `${title} — ${seasonTitle}`,
          shouldPlayImmediately,
        });
      },

      onShowTrailer() {
        const { trailers } = this.state;

        if (trailers.length < 2) {
          this.onShowFirstTrailer();
        } else {
          const title = i18n('tvshow-title', this.state.tvshow);

          TVDML
            .renderModal((
              <document>
                <alertTemplate>
                  <title>
                    {title}
                  </title>
                  {trailers.map(trailer => (
                    <button
                      // eslint-disable-next-line react/jsx-no-bind
                      onSelect={this.playTrailer.bind(this, trailer)}
                    >
                      <text>{trailer.name}</text>
                    </button>
                  ))}
                </alertTemplate>
              </document>
            ))
            .sink();
        }
      },

      onShowFirstTrailer() {
        const [trailer] = this.state.trailers;
        this.playTrailer(trailer);
      },

      playTrailer(trailer) {
        const player = new Player();

        player.playlist = new Playlist();

        getTrailerItem(trailer)
          .then(createMediaItem)
          .then(trailerMediaItem => {
            // Adding available meta information about tvshow and trailer.
            Object.assign(trailerMediaItem, {
              title: i18n('tvshow-title', this.state.tvshow),
              description: trailer.name,
              artworkImageURL: this.props.poster,
            });

            // Adding to playlist and starting player.
            player.playlist.push(trailerMediaItem);
            player.play();
          });
      },

      onAddToSubscriptions() {
        const {
          authorized,
          tvshow: { sid },
        } = this.state;

        if (!authorized) {
          const authHelper = authFactory({
            onError: defaultErrorHandlers,
            onSuccess: ({ token, till, login }) => {
              user.set({ token, till, logged: 1 });
              processFamilyAccount(login)
                .then(this.loadData.bind(this))
                .then(payload => {
                  this.setState(payload);
                  authHelper.dismiss();
                  this.onAddToSubscriptions();
                });
            },
          });

          return TVDML
            .renderModal((
              <Authorize
                description={i18n('authorize-tvshow-description')}
                onAuthorize={() => authHelper.present()}
              />
            ))
            .sink();
        }

        this.setState({
          watching: true,
          likes: this.state.likes + 1,
        });

        return addToMyTVShows(sid);
      },

      onRemoveFromSubscription() {
        const { sid } = this.state.tvshow;

        this.setState({
          watching: false,
          likes: this.state.likes - 1,
        });

        return removeFromMyTVShows(sid);
      },

      onShowFullDescription() {
        const title = i18n('tvshow-title', this.state.tvshow);
        const { description } = this.state.tvshow;

        TVDML
          .renderModal((
            <document>
              <descriptiveAlertTemplate>
                <title>{title}</title>
                <description>{description}</description>
              </descriptiveAlertTemplate>
            </document>
          ))
          .sink();
      },

      onShowFullReview(review) {
        const {
          id,
          text,
          user: userName,
          you_liked: youLiked,
          you_disliked: youDisliked,
        } = review;

        TVDML
          .renderModal((
            <document>
              <descriptiveAlertTemplate>
                <title>{userName}</title>
                <description>{processEntitiesInString(text)}</description>
                {!youLiked && !youDisliked && (
                  <row>
                    <button
                      // eslint-disable-next-line react/jsx-no-bind
                      onSelect={this.onReviewLiked.bind(this, id)}
                    >
                      <text>👍</text>
                    </button>
                    <button
                      // eslint-disable-next-line react/jsx-no-bind
                      onSelect={this.onReviewDisliked.bind(this, id)}
                    >
                      <text>👎</text>
                    </button>
                  </row>
                )}
              </descriptiveAlertTemplate>
            </document>
          ))
          .sink();
      },

      onReviewLiked(id) {
        return markReviewAsLiked(id)
          .then(this.loadData.bind(this))
          .then(this.setState.bind(this))
          .then(TVDML.removeModal);
      },

      onReviewDisliked(id) {
        return markReviewAsDisliked(id)
          .then(this.loadData.bind(this))
          .then(this.setState.bind(this))
          .then(TVDML.removeModal);
      },

      onRate() {
        const { title } = this.props;

        TVDML
          .renderModal((
            <document>
              <ratingTemplate>
                <title>{title}</title>
                <ratingBadge onChange={this.onRateChange} />
              </ratingTemplate>
            </document>
          ))
          .sink();
      },

      onRateChange(event) {
        return this.onRateTVShow(event.value * 10);
      },

      onRateTVShow(rating) {
        const { sid } = this.props;

        return rateTVShow(sid, rating)
          .then(({
            votes: soap_votes,
            rating: soap_rating,
          }) => ({ soap_votes, soap_rating }))
          .then(processedRating => this.setState({
            tvshow: {
              ...this.state.tvshow,
              ...processedRating,
            },
          }))
          .then(TVDML.removeModal);
      },

      onMore() {
        const { seasons } = this.state;
        const hasWatchedEps = seasons.some(({ unwatched }) => !unwatched);
        const hasUnwatchedEps = seasons.some(({ unwatched }) => !!unwatched);

        TVDML
          .renderModal((
            <document>
              <alertTemplate>
                <title>
                  {i18n('tvshow-title-more')}
                </title>
                {hasUnwatchedEps && (
                  <button onSelect={this.onMarkTVShowAsWatched}>
                    <text>
                      {i18n('tvshow-mark-as-watched')}
                    </text>
                  </button>
                )}
                {hasWatchedEps && (
                  <button onSelect={this.onMarkTVShowAsUnwatched}>
                    <text>
                      {i18n('tvshow-mark-as-unwatched')}
                    </text>
                  </button>
                )}
              </alertTemplate>
            </document>
          ))
          .sink();
      },

      onMarkTVShowAsWatched() {
        const { sid } = this.props;

        return markTVShowAsWatched(sid)
          .then(this.loadData.bind(this))
          .then(this.setState.bind(this))
          .then(TVDML.removeModal);
      },

      onMarkTVShowAsUnwatched() {
        const { sid } = this.props;

        return markTVShowAsUnwatched(sid)
          .then(this.loadData.bind(this))
          .then(this.setState.bind(this))
          .then(TVDML.removeModal);
      },
    })));
}
