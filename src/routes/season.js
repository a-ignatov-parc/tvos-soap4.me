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
	getFamilyAccounts,
	getTVShowDescription,
	markSeasonAsWatched,
	markSeasonAsUnwatched,
	markEpisodeAsWatched,
	markEpisodeAsUnwatched,
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
				const authorized = user.isAuthorized();
				const {shouldPlayImmediately} = this.props;
				const translation = settings.get(TRANSLATION);

				return {
					authorized,
					translation,
					loading: true,
					shouldPlayImmediately,
				};
			},

			componentDidMount() {
				this.userStateChangeStream = user.subscription();
				this.userStateChangeStream.pipe(() => this.setState({
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
				const {translation} = this.state;

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
						}));
					})
					.then(payload => assign({}, payload, {
						episodesHasSubtitles: someEpisodesHasSubtitles(payload.episodes),
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

				const {
					episodes,
					translation,
					episodesHasSubtitles,
					season: {season: seasonNumber},
				} = this.state;

				let highlighted = false;

				const settingsTranslation = settings.get(TRANSLATION);
				const title = i18n('tvshow-title', this.state.tvshow);
				const seasonTitle = i18n('tvshow-season', {seasonNumber});

				const poster = (
					<img
						width="400"
						height="400"
						src={this.state.poster}
						style="tv-placeholder: tv"
					/>
				);

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
										{poster}
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
										let {
											spoiler,
											watched,
											date: begins,
											episode: episodeNumber,
										} = episode;

										if (begins) {
											let date = moment(begins, 'DD.MM.YYYY');
											let dateTitle = date.isValid() ? `Airdate ${date.format('ll')}` : '';

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
														{poster}
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
															{this.state.authorized && (
																<buttonLockup 
																	class="control"
																	onSelect={this.onMore}
																>
																	<badge src="resource://button-more" />
																	<title>
																		{i18n('episode-more')}
																	</title>
																</buttonLockup>
															)}
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
				} = this.state;

				this.setState(assign({translation}, getSeasonData({
					id,
					tvshow,
					season,
					schedule,
					translation,
				})));
			},

			onHighlightedItemRender(episode, node) {
				let {episode: episodeNumber} = episode;

				if (this.state.shouldPlayImmediately) {
					this.setState({shouldPlayImmediately: false});
					this.onPlayEpisode(episodeNumber);
				}
			},

			onPlayEpisode(episodeNumber) {
				let {sid, id} = this.props;
				let {episodes, poster, authorized, translation} = this.state;
				let markAsWatched = this.onMarkAsWatched.bind(this);

				if (!authorized) {
					let authHelper = authFactory({
						onError: defaultErrorHandlers,
						onSuccess: ({token, till, login}) => {
							user.set({token, till, logged: 1});

							Promise
								.resolve()
								.then(() => {
									if (user.isExtended()) return getFamilyAccounts();
									return {
										family: [{name: login, fid: 0}],
										selected: null,
									};
								})
								.then(({family, selected}) => user.set({family, selected}))
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

				let resolvers = {
					initial() {
						return episodeNumber;
					},

					next({id}) {
						if (settings.get(VIDEO_PLAYBACK) === BY_EPISODE) return null;
						let [sid, season, episodeNumber] = id.split('-');
						let episode = getEpisode(episodeNumber, episodes);
						let index = episodes.indexOf(episode);
						let nextEpisode = ~index ? episodes[index + 1] : {};
						return nextEpisode.episode || null;
					},
				};

				TVDML
					.createPlayer({
						items(item, request) {
							let episodeNumber = resolvers[request] && resolvers[request](item);
							let episode = getEpisode(episodeNumber, episodes);
							return getEpisodeItem(sid, episode, poster, translation);
						},

						markAsStopped(item, elapsedTime) {
							let {id} = item;
							let [sid, season, episodeNumber] = id.split('-');
							let episode = getEpisode(episodeNumber, episodes);
							let {eid} = getEpisodeMedia(episode, translation);
							return saveElapsedTime(eid, elapsedTime);
						},

						markAsWatched(item) {
							let {id} = item;

							if (!getActiveDocument()) {
								let [sid, season, episodeNumber] = id.split('-');
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

			onMore() {
				let hasWatchedEpisodes = this.state.episodes.some(({watched}) => watched > 0);
				let hasUnwatchedEpisodes = this.state.episodes.some(({watched}) => watched < 1);

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
				let {sid, id} = this.props;

				return markSeasonAsWatched(sid, id)
					.then(this.loadData.bind(this))
					.then(this.setState.bind(this))
					.then(TVDML.removeModal);
			},

			onMarkSeasonAsUnwatched() {
				let {sid, id} = this.props;

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

function getSeasonData(payload) {
	const {
		id,
		tvshow,
		season,
		schedule,
		translation,
	} = payload;

	return getSeasonExtendedData(season, schedule, translation) || {
		season: {season: id},
		poster: tvshow.covers.big,
		episodes: schedule[id - 1].episodes,
	};
}

function getSeasonExtendedData(season, schedule, translation) {
	if (!season) return null;

	const {episodes: seasonEpisodes, covers: {big: poster}} = season;
	const {episodes: scheduleEpisodes} = schedule[season.season - 1];

	const filteredSeasonEpisodes = seasonEpisodes.filter(episode => {
		return translation !== LOCALIZATION || episodeHasTranslation(episode);
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
