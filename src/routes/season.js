/** @jsx TVDML.jsx */

import moment from 'moment';
import * as TVDML from 'tvdml';
import assign from 'object-assign';

import {link} from '../utils';
import * as settings from '../settings';
import {get as i18n} from '../localization';
import {processEntitiesInString} from '../utils/parser';
import {deepEqualShouldUpdate} from '../utils/components';

import * as user from '../user';
import {processFamilyAccount} from '../user/utils';

import authFactory from '../helpers/auth';
import {defaultErrorHandlers} from '../helpers/auth/handlers';

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
import Authorize from '../components/authorize';

const {Promise} = TVDML;

const {VIDEO_QUALITY, VIDEO_PLAYBACK, TRANSLATION} = settings.params;
const {SD, HD, FULLHD} = settings.values[VIDEO_QUALITY];
const {CONTINUES, BY_EPISODE} = settings.values[VIDEO_PLAYBACK];
const {LOCALIZATION, SUBTITLES} = settings.values[TRANSLATION];

const subtitlesList = [
	localization.ORIGINAL_SUBTITLES,
	localization.LOCALIZATION_SUBTITLES,
];

const translationOrder = [
	LOCALIZATION,
	SUBTITLES,
];

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.passthrough(({navigation: {
			id,
			sid,
			title,
			poster,
			episodeNumber,
			shouldPlayImmediately
		}}) => ({sid, id, title, poster, episodeNumber, shouldPlayImmediately})))
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				const extended = user.isExtended();
				const authorized = user.isAuthorized();
				const {shouldPlayImmediately} = this.props;
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
				this.userStateChangeStream = user.subscription();
				this.userStateChangeStream.pipe(() => this.setState({
					extended: user.isExtended(),
					authorized: user.isAuthorized(),
				}));

				// To improuve UX on fast request we are adding rendering timeout.
				let waitForAnimations = new Promise((resolve) => setTimeout(resolve, 500));

				Promise
					.all([this.loadData(), waitForAnimations])
					.then(([payload]) => this.setState(assign({loading: false}, payload)));
			},

			componentWillUnmount() {
				this.userStateChangeStream.unsubscribe();
			},

			shouldComponentUpdate: deepEqualShouldUpdate,

			loadData() {
				const {sid, id} = this.props;
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
					.then(([schedule, season, tvshow]) => ({tvshow, season, schedule}))
					.then(payload => {
						const {
							tvshow,
							season,
							schedule,
						} = payload;

						return assign({}, payload, getSeasonData({
							id,
							tvshow,
							season,
							schedule,
							translation,
						}, !extended), {
							episodesHasSubtitles: someEpisodesHasSubtitles(season.episodes),
						});
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
					translation,
					episodesHasSubtitles,
					season: {season: seasonNumber},
				} = this.state;

				let highlighted = false;

				const settingsTranslation = settings.get(TRANSLATION);
				const title = i18n('tvshow-title', this.state.tvshow);
				const seasonTitle = i18n('tvshow-season', {seasonNumber});

				return (
					<document>
						<head>
							<style content={`
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
							`} />
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
											{translationOrder.map(item => (
												<segmentBarItem
													key={item}
													autoHighlight={settingsTranslation === item ? true : undefined}
													onHighlight={this.switchLocalTranslation.bind(this, item)}
												>
													<title>{i18n(`translation-${item}`)}</title>
												</segmentBarItem>
											))}
										</segmentBar>
									)}
								</segmentBarHeader>
								<section>
									{episodes.map((episode, i) => {
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
											const dateTitle = date.isValid() ? i18n('tvshow-episode-airdate', {airdate}) : '';

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

										const episodePoster = (episode.screenshots || {}).big || this.state.poster;

										const file = getEpisodeMedia(episode, translation);
										const mediaQualityCode = file && mediaQualities[file.quality];
										const mediaTranslationCode = file && mediaLocalizations[file.translate];

										const hasHD = file && mediaQualityCode !== SD;
										const hasSubtitles = !!~subtitlesList.indexOf(mediaTranslationCode);

										let highlight = false;

										const title = processEntitiesInString(i18n('tvshow-episode-title', episode));
										const description = processEntitiesInString(spoiler);

										if (this.props.episodeNumber) {
											highlight = episodeNumber === this.props.episodeNumber;
										} else if (!highlighted && !watched) {
											highlight = true;
											highlighted = true;
										}

										const badges = [
											this.state[`eid-${episodeNumber}`] && (
												<badge class="badge" src="resource://button-checkmark" />
											),
											hasSubtitles && (
												<badge class="badge" src="resource://cc" />
											),
											hasHD && (
												<badge class="badge" src="resource://hd" />
											),
										];

										return (
											<listItemLockup
												class="item"
												autoHighlight={highlight ? 'true' : undefined}
												onSelect={this.onPlayEpisode.bind(this, episodeNumber)}
												ref={highlight ? this.onHighlightedItemRender.bind(this, episode) : undefined}
											>
												<ordinal minLength="3">{episodeNumber}</ordinal>
												<title class="title">
													{title}
												</title>
												<decorationLabel>
													{badges.filter(Boolean).reduce((result, item, i) => {
														i && result.push('  ');
														result.push(item);
														return result;
													}, [])}
												</decorationLabel>
												<relatedContent>
													<lockup>
														{this.renderPoster(episodePoster, true)}
														<row class="controls_container">
															{this.state.authorized && (this.state[`eid-${episodeNumber}`] ? (
																<buttonLockup
																	class="control"
																	onSelect={this.onMarkAsNew.bind(this, episodeNumber)}
																>
																	<badge src="resource://button-remove" />
																	<title>
																		{i18n('episode-mark-as-unwatched')}
																	</title>
																</buttonLockup>
															) : (
																<buttonLockup
																	class="control"
																	onSelect={this.onMarkAsWatched.bind(this, episodeNumber, true)}
																>
																	<badge src="resource://button-add" />
																	<title>
																		{i18n('episode-mark-as-watched')}
																	</title>
																</buttonLockup>
															))}
															{this.state.authorized && [
																(
																	<buttonLockup
																		class="control"
																		onSelect={this.onRate.bind(this, episode)}
																	>
																		<badge src="resource://button-rate" />
																		<title>
																			{i18n('episode-rate')}
																		</title>
																	</buttonLockup>
																), extended && (
																	<buttonLockup
																		class="control"
																		onSelect={link('speedtest')}
																	>
																		<badge src="resource://button-cloud" />
																		<title>
																			{i18n('episode-speedtest')}
																		</title>
																	</buttonLockup>
																), (
																	<buttonLockup 
																		class="control"
																		onSelect={this.onMore}
																	>
																		<badge src="resource://button-more" />
																		<title>
																			{i18n('episode-more')}
																		</title>
																	</buttonLockup>
																)
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
															style="margin: 40 0 0; tv-text-max-lines: 2"
															onSelect={this.onShowDescription.bind(this, {title, description})}
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
				const {id} = this.props;
				const {
					tvshow,
					season,
					schedule,
					extended,
				} = this.state;

				this.setState(assign({translation}, getSeasonData({
					id,
					tvshow,
					season,
					schedule,
					translation,
				}, !extended)));
			},

			onHighlightedItemRender(episode, node) {
				let {episode: episodeNumber} = episode;

				if (this.state.shouldPlayImmediately) {
					this.setState({shouldPlayImmediately: false});
					this.onPlayEpisode(episodeNumber);
				}
			},

			onPlayEpisode(episodeNumber) {
				const {sid, id} = this.props;
				const {episodes, poster, authorized, translation} = this.state;
				const markAsWatched = this.onMarkAsWatched.bind(this);

				if (!authorized) {
					const authHelper = authFactory({
						onError: defaultErrorHandlers,
						onSuccess: ({token, till, login}) => {
							user.set({token, till, logged: 1});
							processFamilyAccount(login)
								.then(this.loadData.bind(this))
								.then(payload => {
									this.setState(payload);
									authHelper.dismiss();
									this.onPlayEpisode(episodeNumber);
								});
						},
					});

					return TVDML
						.renderModal(<Authorize onAuthorize={() => authHelper.present()} />)
						.sink();
				}

				const resolvers = {
					initial() {
						return episodeNumber;
					},

					next({id}) {
						if (settings.get(VIDEO_PLAYBACK) === BY_EPISODE) return null;
						const [sid, season, episodeNumber] = id.split('-');
						const episode = getEpisode(episodeNumber, episodes);
						const index = episodes.indexOf(episode);
						const nextEpisode = ~index ? episodes[index + 1] : {};
						return nextEpisode.episode || null;
					},
				};

				TVDML
					.createPlayer({
						items(item, request) {
							const episodeNumber = resolvers[request] && resolvers[request](item);
							const episode = getEpisode(episodeNumber, episodes);
							return getEpisodeItem(sid, episode, poster, translation);
						},

						markAsStopped(item, elapsedTime) {
							const {id} = item;
							const [sid, season, episodeNumber] = id.split('-');
							const episode = getEpisode(episodeNumber, episodes);
							const {eid} = getEpisodeMedia(episode, translation);
							return saveElapsedTime(eid, elapsedTime);
						},

						markAsWatched(item) {
							const {id} = item;

							if (!getActiveDocument()) {
								const [sid, season, episodeNumber] = id.split('-');
								return markAsWatched(episodeNumber);
							}
						},

						uidResolver(item) {
							return item.id;
						},
					})
					.then(player => player.play());
			},

			onMarkAsNew(episodeNumber) {
				let {id, sid} = this.props;
				this.setState({[`eid-${episodeNumber}`]: false});
				return markEpisodeAsUnwatched(sid, id, episodeNumber);
			},

			onMarkAsWatched(episodeNumber, addTVShowToSubscriptions) {
				let {id, sid} = this.props;
				this.setState({[`eid-${episodeNumber}`]: true});
				return Promise.all([
					markEpisodeAsWatched(sid, id, episodeNumber),
					addTVShowToSubscriptions ? addToMyTVShows(sid) : Promise.resolve(),
				]);
			},

			onShowDescription({title, description}) {
				TVDML
					.renderModal(
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
					)
					.sink();
			},

			onRate(episode) {
				const title = processEntitiesInString(i18n('tvshow-episode-title', episode));

				TVDML
					.renderModal(
						<document>
							<ratingTemplate>
								<title>{title}</title>
								<ratingBadge onChange={this.onRateChange.bind(this, episode)} />
							</ratingTemplate>
						</document>
					)
					.sink();
			},

			onRateChange(episode, event) {
				return this.onRateTVShow(episode, event.value * 10);
			},

			onRateTVShow(episode, rating) {
				const {sid} = this.props;
				const {
					season,
					episode: episodeNumber,
				} = episode;

				return rateEpisode(sid, season, episodeNumber, rating)
					.then(({rating}) => ({rating}))
					.then(rating => {
						const episodes = this.state.episodes.map(episode => {
							if (episode.season === season && episode.episode === episodeNumber) {
								return assign({}, episode, rating);
							}
							return episode;
						});

						this.setState({episodes});
					})
					.then(TVDML.removeModal);
			},

			onMore() {
				const hasWatchedEpisodes = this.state.episodes.some(({watched}) => watched > 0);
				const hasUnwatchedEpisodes = this.state.episodes.some(({watched}) => watched < 1);

				TVDML
					.renderModal(
						<document>
							<alertTemplate>
								<title>
									{i18n('season-title-more')}
								</title>
								{hasUnwatchedEpisodes && (
									<button onSelect={this.onMarkSeasonAsWatched}>
										<text>
											{i18n('season-mark-as-watched')}
										</text>
									</button>
								)}
								{hasWatchedEpisodes && (
									<button onSelect={this.onMarkSeasonAsUnwatched}>
										<text>
											{i18n('season-mark-as-unwatched')}
										</text>
									</button>
								)}
							</alertTemplate>
						</document>
					)
					.sink();
			},

			onMarkSeasonAsWatched() {
				const {sid, id} = this.props;

				return markSeasonAsWatched(sid, id)
					.then(this.loadData.bind(this))
					.then(this.setState.bind(this))
					.then(TVDML.removeModal);
			},

			onMarkSeasonAsUnwatched() {
				const {sid, id} = this.props;

				return markSeasonAsUnwatched(sid, id)
					.then(this.loadData.bind(this))
					.then(this.setState.bind(this))
					.then(TVDML.removeModal);
			},
		})));
}

function getEpisode(episodeNumber, episodes) {
	let [episode] = episodes.filter(({episode}) => episode === episodeNumber);
	return episode;
}

function getEpisodeItem(sid, episode, poster, translation) {
	if (!episode) return null;

	let {
		season,
		spoiler,
		episode: episodeNumber,
		screenshots: {big: episodePoster},
	} = episode;

	let title = processEntitiesInString(i18n('tvshow-episode-title', episode));
	let description = processEntitiesInString(spoiler);

	let id = [sid, season, episodeNumber].join('-');
	let file = getEpisodeMedia(episode, translation);
	let media = {sid, file};

	return getMediaStream(media).then(({stream, start_from}) => ({
		id,
		title,
		description,
		url: stream,
		artworkImageURL: poster || episodePoster,
		resumeTime: start_from && parseFloat(start_from),
	}));
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
		season: {season: id},
		poster: tvshow.covers.big,
		episodes: schedule[id - 1].episodes,
	};
}

function getSeasonExtendedData(season, schedule, translation, isDemo) {
	if (!season) return null;

	const {episodes: seasonEpisodes, covers: {big: poster}} = season;
	const {episodes: scheduleEpisodes} = schedule[season.season - 1];

	const filteredSeasonEpisodes = seasonEpisodes.filter(episode => {
		return isDemo || translation !== LOCALIZATION || episodeHasTranslation(episode);
	});

	const seasonEpisodesDictionary = filteredSeasonEpisodes.reduce((result, episode) => {
		result[episode.episode] = episode;
		return result;
	}, {});

	const scheduleDiff = scheduleEpisodes.filter(({episode}) => !seasonEpisodesDictionary[episode]);
	const episodes = filteredSeasonEpisodes.concat(scheduleDiff);

	return episodes.reduce((result, {episode, watched}) => {
		result[`eid-${episode}`] = !!watched;
		return result;
	}, {
		poster,
		episodes,
	});
}

function episodeHasTranslation({files = []}) {
	return files.some(({translate}) => mediaLocalizations[translate] === localization.LOCALIZATION);
}

function episodeHasSubtitles({files = []}) {
	return files.some(({translate}) => mediaLocalizations[translate] !== localization.LOCALIZATION);
}

function someEpisodesHasSubtitles(episodes) {
	return episodes.some(episodeHasSubtitles);
}
