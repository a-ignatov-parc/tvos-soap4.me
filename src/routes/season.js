/* global Player Playlist */

import moment from 'moment';
import * as TVDML from 'tvdml';

import { getStartParams, createMediaItem } from '../utils';
import { processEntitiesInString } from '../utils/parser';
import { deepEqualShouldUpdate } from '../utils/components';

import * as settings from '../settings';
import * as user from '../user';

import { get as i18n } from '../localization';

import {
  localization,
  mediaQualities,
  mediaLocalizations,
  addToMyTVShows,
  saveElapsedTime,
  getMediaStream,
  getEpisodeMedia,
  getTVShowSeason,
  getTVShowSchedule,
  getTVShowDescription,
  markEpisodeAsWatched,
  markEpisodeAsUnwatched,
  rateEpisode,
} from '../request/soap';

import Loader from '../components/loader';

import hand from '../assets/icons/hand.png';
import hand2x from '../assets/icons/hand@2x.png';

const MARK_AS_WATCHED_PERCENTAGE = 90;
const SHOW_RATING_PERCENTAGE = 50;
const RATING_SCREEN_TIMEOUT = 10;

const { VIDEO_QUALITY, VIDEO_PLAYBACK, TRANSLATION } = settings.params;
const { SD, UHD } = settings.values[VIDEO_QUALITY];
const { CONTINUES } = settings.values[VIDEO_PLAYBACK];
const { LOCALIZATION, SUBTITLES } = settings.values[TRANSLATION];

const subtitlesList = [
  localization.ORIGINAL_SUBTITLES,
  localization.LOCALIZATION_SUBTITLES,
];

const translationOrder = [
  LOCALIZATION,
  SUBTITLES,
];

function getEpisode(episodeNumber, episodes) {
  const [episode] = episodes.filter(item => item.episode === episodeNumber);
  return episode;
}

function getEpisodeItem(sid, episode, poster, translation) {
  if (!episode) return null;

  const {
    season,
    spoiler,
    episode: episodeNumber,
    screenshots: { big: episodePoster },
  } = episode;

  const title = processEntitiesInString(i18n('tvshow-episode-title', episode));
  const description = processEntitiesInString(spoiler);

  const id = [sid, season, episodeNumber].join('-');
  const file = getEpisodeMedia(episode, translation);
  const media = { sid, file };

  return getMediaStream(media).then(({ stream, start_from: startFrom }) => ({
    id,
    title,
    description,
    url: stream,
    artworkImageURL: poster || episodePoster,
    resumeTime: startFrom && parseFloat(startFrom),
  }));
}

function getScheduleEpsForSeason(schedule, season) {
  const [seasonSchedule] = (schedule || []).filter(scheduleItem => {
    const scheduledSeason = scheduleItem.season;

    /**
     * Апи може может присылать `id` как числом так и строкой.
     * Поэтому делаем сравнение с приведением типов.
     */
    // eslint-disable-next-line eqeqeq
    return scheduledSeason == season;
  });
  return (seasonSchedule || {}).episodes || [];
}

function episodeHasTranslation({ files = [] }) {
  return files.some(({ translate }) => {
    const mediaLocalization = mediaLocalizations[translate];
    return mediaLocalization === localization.LOCALIZATION;
  });
}

function episodeHasSubtitles({ files = [] }) {
  return files.some(({ translate }) => {
    const mediaLocalization = mediaLocalizations[translate];
    return mediaLocalization !== localization.LOCALIZATION;
  });
}

function getSeasonExtendedData(season, schedule, translation, isDemo) {
  if (!season) return null;

  const {
    episodes: seasonEpisodes,
    covers: { big: poster },
  } = season;

  const scheduleEpisodes = getScheduleEpsForSeason(schedule, season.season);

  const filteredSeasonEps = seasonEpisodes.filter(episode => isDemo
    || translation !== LOCALIZATION
    || episodeHasTranslation(episode));

  const seasonEpsDictionary = filteredSeasonEps.reduce((result, episode) => {
    // eslint-disable-next-line no-param-reassign
    result[episode.episode] = episode;
    return result;
  }, {});

  const scheduleDiff = scheduleEpisodes.filter(item => {
    const { episode } = item;
    return !seasonEpsDictionary[episode];
  });

  const episodes = filteredSeasonEps
    .concat(scheduleDiff)
    .sort((a, b) => a.episode - b.episode);

  return episodes.reduce((result, { episode, watched }) => {
    // eslint-disable-next-line no-param-reassign
    result[`eid-${episode}`] = !!watched;
    return result;
  }, { poster, episodes });
}

function getSeasonData(payload, isDemo) {
  const {
    id,
    tvshow,
    season,
    schedule,
    translation,
  } = payload;

  return getSeasonExtendedData(season, schedule, translation, isDemo) || {
    season: { season: id },
    poster: tvshow.covers.big,
    episodes: getScheduleEpsForSeason(schedule, id),
  };
}

function someEpisodesHasSubtitles(episodes) {
  return episodes.some(episodeHasSubtitles);
}

export default function seasonRoute() {
  return TVDML
    .createPipeline()
    .pipe(TVDML.passthrough(({
      navigation: {
        id,
        sid,
        title,
        poster,
        episodeNumber,
        shouldPlayImmediately,
      },
    }) => ({ sid, id, title, poster, episodeNumber, shouldPlayImmediately })))
    .pipe(TVDML.render(TVDML.createComponent({
      getInitialState() {
        const {
          episodeNumber,
          shouldPlayImmediately,
        } = this.props;

        const extended = user.isExtended();
        const authorized = user.isAuthorized();
        const translation = settings.get(TRANSLATION);

        return {
          extended,
          authorized,
          translation,
          loading: true,
          shouldPlayImmediately,
          highlightEpisode: episodeNumber,
        };
      },

      componentDidMount() {
        const setState = this.setState.bind(this);

        this.appResumeStream = TVDML.subscribe(TVDML.event.RESUME);
        this.appResumeStream.pipe(() => this.loadData().then(setState));

        // To improuve UX on fast request we are adding rendering timeout.
        const waitForAnimations = new Promise(done => setTimeout(done, 500));

        Promise
          .all([this.loadData(), waitForAnimations])
          .then(([payload]) => this.setState({ loading: false, ...payload }));
      },

      componentWillUnmount() {
        this.appResumeStream.unsubscribe();
      },

      shouldComponentUpdate: deepEqualShouldUpdate,

      loadData() {
        const {
          id,
          sid,
        } = this.props;

        const {
          extended,
          translation,
          highlightEpisode,
        } = this.state;

        return Promise
          .all([
            getTVShowSchedule(sid),
            getTVShowSeason(sid, id),
            getTVShowDescription(sid),
          ])
          .then(([schedule, season, tvshow]) => ({ tvshow, season, schedule }))
          .then(payload => {
            const {
              tvshow,
              season,
              schedule,
            } = payload;

            const episodes = season ? season.episodes : [];
            const firstUnwatchedEp = episodes.find(({ watched }) => !watched);
            const firstUnwatchedEpNumber = (firstUnwatchedEp || {}).episode;

            const highlight = highlightEpisode || firstUnwatchedEpNumber;

            return {
              ...payload,
              ...getSeasonData({
                id,
                tvshow,
                season,
                schedule,
                translation,
              }, !extended),
              highlightEpisode: highlight,
              episodesHasSubtitles: someEpisodesHasSubtitles(episodes),
            };
          });
      },

      renderPoster(src, wide) {
        let size = {
          width: 400,
          height: 400,
        };

        if (wide) {
          size = {
            width: 710,
            height: 400,
          };
        }

        return (
          <img
            src={src}
            style="tv-placeholder: tv"
            {...size}
          />
        );
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

        const {
          tvshow,
          season,
          extended,
          episodes,
          translation,
          highlightEpisode,
          episodesHasSubtitles,
        } = this.state;

        const {
          season: seasonNumber,
        } = season;

        const { BASEURL } = getStartParams();
        const settingsTranslation = settings.get(TRANSLATION);

        const title = i18n('tvshow-title', tvshow);
        const seasonTitle = i18n('tvshow-season', { seasonNumber });

        return (
          <document>
            <head>
              <style
                content={`
                  .controls_container {
                    margin: 40 0 0;
                    tv-align: center;
                    tv-content-align: top;
                    tv-interitem-spacing: 24;
                  }

                  .item {
                    background-color: rgba(255, 255, 255, 0.05);
                    tv-highlight-color: rgba(255, 255, 255, 0.9);
                  }

                  .item-content {
                    margin: 60 75 0 0;
                  }

                  .item-desc {
                    margin: 40 0 0;
                  }

                  .item--disabled {
                    color: rgba(0, 0, 0, 0.3);
                  }

                  @media tv-template and (tv-theme:dark) {
                    .item--disabled {
                      color: rgba(255, 255, 255, 0.3);
                    }
                  }

                  .title {
                    tv-text-highlight-style: marquee-on-highlight;
                  }

                  @media tv-template and (tv-theme:dark) {
                    .badge {
                      tv-tint-color: rgb(255, 255, 255);
                    }
                  }
                `}
              />
            </head>
            <compilationTemplate>
              <background>
                <heroImg src={this.state.poster} />
              </background>
              <list>
                <relatedContent>
                  <lockup>
                    {this.renderPoster(this.state.poster)}
                  </lockup>
                </relatedContent>
                <segmentBarHeader>
                  <title>{title}</title>
                  <subtitle>{seasonTitle}</subtitle>
                  {episodesHasSubtitles && (
                    <segmentBar>
                      {translationOrder.map(item => {
                        const autoHighlight = settingsTranslation === item
                          ? true :
                          undefined;

                        return (
                          <segmentBarItem
                            key={item}
                            autoHighlight={autoHighlight}

                            // eslint-disable-next-line react/jsx-no-bind
                            onHighlight={this.switchLocalTranslation.bind(...[
                              this,
                              item,
                            ])}
                          >
                            <title>{i18n(`translation-${item}`)}</title>
                          </segmentBarItem>
                        );
                      })}
                    </segmentBar>
                  )}
                </segmentBarHeader>
                <section>
                  {episodes.map(episode => {
                    const {
                      rating,
                      spoiler,
                      date: begins,
                      episode: episodeNumber,
                    } = episode;

                    if (begins) {
                      const date = moment(begins, 'DD.MM.YYYY');
                      const airdate = date.format('ll');

                      const dateTitle = date.isValid()
                        ? i18n('tvshow-episode-airdate', { airdate })
                        : '';

                      return (
                        <listItemLockup class="item item--disabled">
                          <ordinal minLength="3">{episodeNumber}</ordinal>
                          <title class="title">
                            {episode.title}
                          </title>
                          <decorationLabel>
                            <text>{dateTitle}</text>
                          </decorationLabel>
                        </listItemLockup>
                      );
                    }

                    const episodePoster = (episode.screenshots || {}).big
                      || this.state.poster;

                    const file = getEpisodeMedia(episode, translation);
                    const mqCode = file && mediaQualities[file.quality];
                    const mtCode = file && mediaLocalizations[file.translate];

                    const hasHD = file && mqCode !== SD;
                    const isUHD = hasHD && mqCode === UHD;
                    const hasSubtitles = !!~subtitlesList.indexOf(mtCode);

                    const highlight = episodeNumber === highlightEpisode;

                    const epTitleCode = i18n('tvshow-episode-title', episode);
                    const epTitle = processEntitiesInString(epTitleCode);
                    const description = processEntitiesInString(spoiler);

                    const epId = `eid-${episodeNumber}`;

                    const badges = [
                      this.state[epId] && (
                        <badge
                          class="badge"
                          src="resource://button-checkmark"
                        />
                      ),
                      hasSubtitles && (
                        <badge class="badge" src="resource://cc" />
                      ),
                      hasHD && (
                        <badge
                          class="badge"
                          src={`resource://${isUHD ? '4k' : 'hd'}`}
                        />
                      ),
                    ];

                    // eslint-disable-next-line react/jsx-no-bind
                    const onSelectDesc = this.onShowMenu.bind(this, episode);

                    const onSelectEpisode = extended
                      // eslint-disable-next-line react/jsx-no-bind
                      ? this.playEpisode.bind(this, episodeNumber)
                      : onSelectDesc;

                    const listItemRef = highlight
                      // eslint-disable-next-line react/jsx-no-bind
                      ? this.onHighlightedItemRender.bind(this, episode)
                      : undefined;

                    return (
                      <listItemLockup
                        class="item"
                        ref={listItemRef}
                        onPlay={onSelectEpisode}
                        onSelect={onSelectEpisode}
                        onHoldselect={onSelectDesc}
                        autoHighlight={highlight ? 'true' : undefined}
                      >
                        <ordinal minLength="3">{episodeNumber}</ordinal>
                        <title class="title">
                          {epTitle}
                        </title>
                        <decorationLabel>
                          {badges.filter(Boolean).reduce((result, item, i) => {
                            if (i) result.push('  ');
                            result.push(item);
                            return result;
                          }, [])}
                        </decorationLabel>
                        <relatedContent>
                          <lockup class="item-content">
                            {this.renderPoster(episodePoster, true)}
                            <row class="controls_container">
                              <ratingBadge
                                style="tv-rating-style: star-l"
                                value={rating / 10}
                              />
                            </row>
                            <description class="item-desc">
                              {description}
                            </description>
                            <description class="item-desc">
                              <badge
                                class="badge"
                                style="margin: 0 0 -5"
                                width="30"
                                height="30"
                                srcset={`
                                  ${BASEURL + hand} 1x,
                                  ${BASEURL + hand2x} 2x
                                `}
                              />
                              {' '}
                              {i18n('tvshow-episode-menu-hint')}
                            </description>
                          </lockup>
                        </relatedContent>
                      </listItemLockup>
                    );
                  })}
                </section>
              </list>
            </compilationTemplate>
          </document>
        );
      },

      switchLocalTranslation(translation) {
        const { id } = this.props;
        const {
          tvshow,
          season,
          schedule,
          extended,
        } = this.state;

        const currentWatchedMarks = Object
          .keys(this.state)
          .filter(key => !key.indexOf('eid-'))
          .reduce((result, key) => {
            // eslint-disable-next-line no-param-reassign
            result[key] = this.state[key];
            return result;
          }, {});

        this.setState({
          translation,
          ...getSeasonData({
            id,
            tvshow,
            season,
            schedule,
            translation,
          }, !extended),
          ...currentWatchedMarks,
        });
      },

      onHighlightedItemRender(episode) {
        const { episode: episodeNumber } = episode;

        if (this.state.shouldPlayImmediately) {
          this.setState({ shouldPlayImmediately: false });
          this.playEpisode(episodeNumber);
        }
      },

      playEpisode(episodeNumber) {
        const {
          sid,
        } = this.props;

        const {
          poster,
          episodes,
          translation,
        } = this.state;

        const player = new Player();

        player.playlist = new Playlist();
        player.interactiveOverlayDismissable = false;

        player.addEventListener('timeDidChange', ({ time }) => {
          const {
            currentMediaItem,
            currentMediaItemDuration,
          } = player;

          currentMediaItem.currentTime = time;

          if (!currentMediaItem.duration) {
            currentMediaItem.duration = currentMediaItemDuration;
          }

          if (!currentMediaItem.watchedTime) {
            currentMediaItem.watchedTime = 0;
          }

          // Incrementing watched time by 1sec.
          currentMediaItem.watchedTime += 1;

          const [,, currentEpisodeNumber] = currentMediaItem.id.split('-');
          const currentEpisode = getEpisode(currentEpisodeNumber, episodes);

          const watchedPercent = (time * 100) / currentMediaItemDuration;
          const passedBoundary = watchedPercent >= MARK_AS_WATCHED_PERCENTAGE;

          if (passedBoundary && !currentMediaItem.markedAsWatched) {
            currentMediaItem.markedAsWatched = true;

            const index = episodes.indexOf(currentEpisode);
            const nextEpisodeNumber = (episodes[index + 1] || {}).episode;

            this.onMarkAsWatched(currentEpisodeNumber);

            // Setting next episode as highlighted if exist
            if (nextEpisodeNumber) {
              this.setState({ highlightEpisode: nextEpisodeNumber });
            }

            /**
             * If user configured app for continues playback then loading next
             * episode media file and adding it to current playlist.
             */
            if (settings.get(VIDEO_PLAYBACK) === CONTINUES) {
              const nextEpisode = getEpisode(nextEpisodeNumber, episodes);

              getEpisodeItem(sid, nextEpisode, poster, translation)
                .then(createMediaItem)
                .then(episodeMediaItem => {
                  player.playlist.push(episodeMediaItem);
                });
            }
          }

          const {
            duration,
            watchedTime,
            markedAsRated,
          } = currentMediaItem;

          /**
           * Rounding time values to lower integer and checking if it's last
           * second of the episode.
           */
          if (~~time === ~~duration && !markedAsRated) {
            currentMediaItem.markedAsRated = true;

            const minimalWatchTime = (duration * SHOW_RATING_PERCENTAGE) / 100;

            /**
             * Creating bound closure for rate method to be able to use in
             * child component.
             */
            const onRateChange = this.onRateChange.bind(this);

            /**
             * Don't show rating screen if watched time less than minimum
             * allowed time. This means that user didn't watch episode enough
             * to rate it.
             */
            if (watchedTime < minimalWatchTime) return;

            /**
             * Pausing player so we can show rating screen with blocked
             * controls.
             * All thanks to `player.interactiveOverlayDismissable`.
             */
            player.pause();

            /**
             * Parsing document because we don't want to show rating screen
             * as normal screen. It must be rendered
             * as `interactiveOverlayDocument`.
             */
            TVDML
              .parseDocument(TVDML.createComponent({
                getInitialState() {
                  return {
                    timeout: RATING_SCREEN_TIMEOUT,
                  };
                },

                componentDidMount() {
                  this.timer = setInterval(() => {
                    if (this.state.timeout > 1) {
                      this.setState({
                        timeout: this.state.timeout - 1,
                      });
                    } else {
                      this.resumePlayback();
                    }
                  }, 1000);
                },

                resumePlayback() {
                  if (this.timer) clearInterval(this.timer);

                  /**
                   * Also we need to manually unmount previously created
                   * document.
                   */
                  player.interactiveOverlayDocument.destroyComponent();
                  player.interactiveOverlayDocument = null;
                  player.play();
                },

                render() {
                  const { timeout } = this.state;

                  return (
                    <document>
                      <ratingTemplate
                        style="background-color: rgba(0,0,0,0.8)"
                      >
                        <title>
                          {i18n('episode-rate-title', { timeout })}
                        </title>
                        <ratingBadge
                          onChange={event => {
                            onRateChange(currentEpisode, event).then(() => {
                              this.resumePlayback();
                            });
                          }}
                        />
                      </ratingTemplate>
                    </document>
                  );
                },
              }))
              .pipe(payload => {
                const { parsedDocument: document } = payload;
                player.interactiveOverlayDocument = document;

                /**
                 * Because we created document bypassing normal rendering
                 * pipeline we need to mount document manually by invoking
                 * `didMount` method.
                 */
                document.didMount();
              })
              .sink();
          }
        }, { interval: 1 });

        player.addEventListener('stateWillChange', event => {
          const { currentMediaItem } = player;
          const isEnded = event.state === 'end';
          const isPaused = event.state === 'paused';
          const isProperState = isEnded || isPaused;
          const shouldSaveTime = currentMediaItem
            && !currentMediaItem.markedAsWatched
            && isProperState;

          if (shouldSaveTime) {
            const {
              id,
              currentTime,
            } = currentMediaItem;

            const [,, currentEpisodeNumber] = id.split('-');
            const currentEpisode = getEpisode(currentEpisodeNumber, episodes);
            const { eid } = getEpisodeMedia(currentEpisode, translation);

            saveElapsedTime(eid, currentTime);
          }
        });

        const episode = getEpisode(episodeNumber, episodes);

        // Loading initial episode and starting playback.
        getEpisodeItem(sid, episode, poster, translation)
          .then(createMediaItem)
          .then(episodeMediaItem => {
            player.playlist.push(episodeMediaItem);
            player.play();
          });
      },

      onShowMenu(episode) {
        const {
          authorized,
        } = this.state;

        const {
          spoiler,
          episode: episodeNumber,
        } = episode;

        const epId = `eid-${episodeNumber}`;

        const titleCode = i18n('tvshow-episode-title', episode);
        const title = processEntitiesInString(titleCode);
        const description = processEntitiesInString(spoiler);

        TVDML
          .renderModal((
            <document>
              <descriptiveAlertTemplate>
                <title>
                  {title}
                </title>
                <description>
                  {description}
                </description>
                <row style="tv-content-align: top">
                  {authorized && [
                    (
                      <buttonLockup
                        // eslint-disable-next-line
                        onSelect={this.onRate.bind(this, episode)}
                      >
                        <badge src="resource://button-rate" />
                        <title>
                          {i18n('episode-rate')}
                        </title>
                      </buttonLockup>
                    ),
                  ]}
                  {authorized && (this.state[epId] ? (
                    <buttonLockup
                      // eslint-disable-next-line react/jsx-no-bind
                      onSelect={this.onMarkAsNew.bind(...[
                        this,
                        episodeNumber,
                      ])}
                    >
                      <badge src="resource://button-remove" />
                      <title>
                        {i18n('episode-mark-as-unwatched')}
                      </title>
                    </buttonLockup>
                  ) : (
                    <buttonLockup
                      // eslint-disable-next-line react/jsx-no-bind
                      onSelect={this.onMarkAsWatched.bind(...[
                        this,
                        episodeNumber,
                        true,
                      ])}
                    >
                      <badge src="resource://button-add" />
                      <title>
                        {i18n('episode-mark-as-watched')}
                      </title>
                    </buttonLockup>
                  ))}
                </row>
              </descriptiveAlertTemplate>
            </document>
          ))
          .sink();
      },

      onMarkAsNew(episodeNumber) {
        const { id, sid } = this.props;

        this.setState({ [`eid-${episodeNumber}`]: false });

        return markEpisodeAsUnwatched(sid, id, episodeNumber)
          .then(TVDML.removeModal);
      },

      onMarkAsWatched(episodeNumber, addTVShowToSubscriptions) {
        const {
          id,
          sid,
        } = this.props;

        const {
          tvshow,
        } = this.state;

        const addShowToWatched = addTVShowToSubscriptions && !tvshow.watching;

        this.setState({ [`eid-${episodeNumber}`]: true });

        return Promise
          .all([
            markEpisodeAsWatched(sid, id, episodeNumber),
            addShowToWatched ? addToMyTVShows(sid) : Promise.resolve(),
          ])
          .then(TVDML.removeModal);
      },

      onRate(episode) {
        const title = i18n('tvshow-episode-title', episode);
        const processedTitle = processEntitiesInString(title);

        TVDML
          .renderModal((
            <document>
              <ratingTemplate>
                <title>{processedTitle}</title>
                <ratingBadge
                  // eslint-disable-next-line react/jsx-no-bind
                  onChange={this.onRateChange.bind(this, episode)}
                />
              </ratingTemplate>
            </document>
          ))
          .sink();
      },

      onRateChange(episode, event) {
        return this.onRateTVShow(episode, event.value * 10);
      },

      onRateTVShow(episode, rating) {
        const { sid } = this.props;

        const {
          season,
          episode: episodeNumber,
        } = episode;

        return rateEpisode(sid, season, episodeNumber, rating)
          .then(result => {
            const episodes = this.state.episodes.map(item => {
              if (item.season === season && item.episode === episodeNumber) {
                return {
                  ...item,
                  rating: result.rating,
                };
              }
              return item;
            });

            this.setState({ episodes });
          })
          .then(TVDML.removeModal);
      },
    })));
}
