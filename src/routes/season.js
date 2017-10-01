/* global getActiveDocument */

import moment from 'moment';
import * as TVDML from 'tvdml';

import { link } from '../utils';
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
  markSeasonAsWatched,
  markSeasonAsUnwatched,
  markEpisodeAsWatched,
  markEpisodeAsUnwatched,
  rateEpisode,
} from '../request/soap';

import Loader from '../components/loader';

const { Promise } = TVDML;

const { VIDEO_QUALITY, VIDEO_PLAYBACK, TRANSLATION } = settings.params;
const { SD } = settings.values[VIDEO_QUALITY];
const { BY_EPISODE } = settings.values[VIDEO_PLAYBACK];
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

  const episodes = filteredSeasonEps.concat(scheduleDiff);

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

export default function searchRoute() {
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
        const extended = user.isExtended();
        const authorized = user.isAuthorized();
        const { shouldPlayImmediately } = this.props;
        const translation = settings.get(TRANSLATION);

        return {
          extended,
          authorized,
          translation,
          loading: true,
          shouldPlayImmediately,
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
        const { sid, id } = this.props;

        const {
          extended,
          translation,
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

            return {
              ...payload,
              ...getSeasonData({
                id,
                tvshow,
                season,
                schedule,
                translation,
              }, !extended),
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
          extended,
          episodes,
          authorized,
          translation,
          episodesHasSubtitles,
          season: { season: seasonNumber },
        } = this.state;

        let highlighted = false;

        const settingsTranslation = settings.get(TRANSLATION);
        const title = i18n('tvshow-title', this.state.tvshow);
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
                  }

                  .control {
                    margin: 0 24;
                  }

                  .item {
                    background-color: rgba(255, 255, 255, 0.05);
                    tv-highlight-color: rgba(255, 255, 255, 0.9);
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
                      watched,
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
                    const hasSubtitles = !!~subtitlesList.indexOf(mtCode);

                    let highlight = false;

                    const epTitleCode = i18n('tvshow-episode-title', episode);
                    const epTitle = processEntitiesInString(epTitleCode);
                    const description = processEntitiesInString(spoiler);

                    if (this.props.episodeNumber) {
                      highlight = episodeNumber === this.props.episodeNumber;
                    } else if (!highlighted && !watched) {
                      highlight = true;
                      highlighted = true;
                    }

                    const badges = [
                      this.state[`eid-${episodeNumber}`] && (
                        <badge
                          class="badge"
                          src="resource://button-checkmark"
                        />
                      ),
                      hasSubtitles && (
                        <badge class="badge" src="resource://cc" />
                      ),
                      hasHD && (
                        <badge class="badge" src="resource://hd" />
                      ),
                    ];

                    // eslint-disable-next-line react/jsx-no-bind
                    const onSelectDesc = this.onShowDescription.bind(this, {
                      title: epTitle,
                      description,
                    });

                    const onSelectEpisode = extended
                      // eslint-disable-next-line react/jsx-no-bind
                      ? this.onPlayEpisode.bind(this, episodeNumber)
                      : onSelectDesc;

                    const epId = `eid-${episodeNumber}`;

                    const listItemRef = highlight
                      // eslint-disable-next-line react/jsx-no-bind
                      ? this.onHighlightedItemRender.bind(this, episode)
                      : undefined;

                    return (
                      <listItemLockup
                        class="item"
                        ref={listItemRef}
                        onSelect={onSelectEpisode}
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
                          <lockup>
                            {this.renderPoster(episodePoster, true)}
                            <row class="controls_container">
                              {authorized && (this.state[epId] ? (
                                <buttonLockup
                                  class="control"

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
                                  class="control"

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
                              {authorized && [
                                (
                                  <buttonLockup
                                    class="control"

                                    // eslint-disable-next-line
                                    onSelect={this.onRate.bind(this, episode)}
                                  >
                                    <badge src="resource://button-rate" />
                                    <title>
                                      {i18n('episode-rate')}
                                    </title>
                                  </buttonLockup>
                                ),
                                extended && (
                                  <buttonLockup
                                    class="control"
                                    onSelect={link('speedtest')}
                                  >
                                    <badge src="resource://button-cloud" />
                                    <title>
                                      {i18n('episode-speedtest')}
                                    </title>
                                  </buttonLockup>
                                ),
                                (
                                  <buttonLockup
                                    class="control"
                                    onSelect={this.onMore}
                                  >
                                    <badge src="resource://button-more" />
                                    <title>
                                      {i18n('episode-more')}
                                    </title>
                                  </buttonLockup>
                                ),
                              ]}
                            </row>
                            <row class="controls_container">
                              <ratingBadge
                                style="tv-rating-style: star-l"
                                value={rating / 10}
                              />
                            </row>
                            <description
                              handlesOverflow="true"
                              style="margin: 40 0 0; tv-text-max-lines: 1"
                              onSelect={onSelectDesc}
                            >{description}</description>
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
          this.onPlayEpisode(episodeNumber);
        }
      },

      onPlayEpisode(episodeNumber) {
        const { sid } = this.props;
        const { episodes, poster, translation } = this.state;
        const markAsWatched = this.onMarkAsWatched.bind(this);

        const resolvers = {
          initial() {
            return episodeNumber;
          },

          next(item) {
            if (settings.get(VIDEO_PLAYBACK) === BY_EPISODE) return null;
            const [,, epNumber] = item.id.split('-');
            const episode = getEpisode(epNumber, episodes);
            const index = episodes.indexOf(episode);
            const nextEpisode = ~index ? episodes[index + 1] : {};
            return nextEpisode.episode || null;
          },
        };

        TVDML
          .createPlayer({
            items(item, request) {
              const resolver = resolvers[request];
              const epNumber = resolver && resolver(item);
              const episode = getEpisode(epNumber, episodes);
              return getEpisodeItem(sid, episode, poster, translation);
            },

            markAsStopped(item, elapsedTime) {
              const [,, epNumber] = item.id.split('-');
              const episode = getEpisode(epNumber, episodes);
              const { eid } = getEpisodeMedia(episode, translation);
              return saveElapsedTime(eid, elapsedTime);
            },

            markAsWatched(item) {
              if (!getActiveDocument()) {
                const [,, epNumber] = item.id.split('-');
                return markAsWatched(epNumber);
              }
              return null;
            },

            uidResolver(item) {
              return item.id;
            },
          })
          .then(player => player.play());
      },

      onMarkAsNew(episodeNumber) {
        const { id, sid } = this.props;

        this.setState({ [`eid-${episodeNumber}`]: false });

        return markEpisodeAsUnwatched(sid, id, episodeNumber);
      },

      onMarkAsWatched(episodeNumber, addTVShowToSubscriptions) {
        const { id, sid } = this.props;

        this.setState({ [`eid-${episodeNumber}`]: true });

        return Promise.all([
          markEpisodeAsWatched(sid, id, episodeNumber),
          addTVShowToSubscriptions ? addToMyTVShows(sid) : Promise.resolve(),
        ]);
      },

      onShowDescription({ title, description }) {
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
              </descriptiveAlertTemplate>
            </document>
          ))
          .sink();
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

      onMore() {
        const { episodes } = this.state;

        const hasWatchedEps = episodes.some(({ watched }) => watched > 0);
        const hasUnwatchedEps = episodes.some(({ watched }) => watched < 1);

        TVDML
          .renderModal((
            <document>
              <alertTemplate>
                <title>
                  {i18n('season-title-more')}
                </title>
                {hasUnwatchedEps && (
                  <button onSelect={this.onMarkSeasonAsWatched}>
                    <text>
                      {i18n('season-mark-as-watched')}
                    </text>
                  </button>
                )}
                {hasWatchedEps && (
                  <button onSelect={this.onMarkSeasonAsUnwatched}>
                    <text>
                      {i18n('season-mark-as-unwatched')}
                    </text>
                  </button>
                )}
              </alertTemplate>
            </document>
          ))
          .sink();
      },

      onMarkSeasonAsWatched() {
        const { sid, id } = this.props;

        return markSeasonAsWatched(sid, id)
          .then(this.loadData.bind(this))
          .then(this.setState.bind(this))
          .then(TVDML.removeModal);
      },

      onMarkSeasonAsUnwatched() {
        const { sid, id } = this.props;

        return markSeasonAsUnwatched(sid, id)
          .then(this.loadData.bind(this))
          .then(this.setState.bind(this))
          .then(TVDML.removeModal);
      },
    })));
}
