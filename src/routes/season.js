/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';
import assign from 'object-assign';

import {link} from '../utils';
import * as settings from '../settings';
import {processEntitiesInString} from '../utils/parser';

import {
	localization,
	mediaQualities,
	mediaLocalizations,
	getMediaStream,
	getTVShowSeason,
	getEpisodeMedia,
	getTVShowDescription,
	markEpisodeAsWatched,
	markEpisodeAsUnWatched,
} from '../request/soap';

import Loader from '../components/loader';

const {Promise} = TVDML;

const {VIDEO_QUALITY} = settings.params;
const {SD, HD, FULLHD} = settings.values[VIDEO_QUALITY];

const translationList = [
	localization.LOCALIZATION,
	localization.LOCALIZATION_SUBTITLES,
];

const subtitlesList = [
	localization.ORIGINAL_SUBTITLES,
	localization.LOCALIZATION_SUBTITLES,
];

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.passthrough(({navigation: {sid, id, title, episode}}) => ({sid, id, title, episode})))
		.pipe(TVDML.render(({title}) => {
			return <Loader title={title} />;
		}))
		.pipe(TVDML.passthrough(({sid, id}) => {
			return Promise
				.all([
					getTVShowSeason(sid, id),
					getTVShowDescription(sid),
				])
				.then(([season, tvshow]) => ({tvshow, season}));
		}))
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				let {episodes, covers: {big: poster}} = this.props.season;

				return episodes.reduce((result, {episode, watched}) => {
					result[`eid-${episode}`] = !!watched;
					return result;
				}, {
					poster,
					episodes,
				});
			},

			render() {
				let highlighted = false;
				let {title} = this.props.tvshow;
				let {episodes} = this.state;

				return (
					<document>
						<compilationTemplate theme="light">
							<background>
								<heroImg src={this.state.poster} />
							</background>
							<list>
								<segmentBarHeader>
									<title>{title}</title>
									<subtitle>Season {this.props.season.season}</subtitle>
								</segmentBarHeader>
								<section>
									{episodes.map((episode, i) => {
										let {
											title_en,
											spoiler,
											watched,
											episode: episodeNumber,
										} = episode;

										let file = getEpisodeMedia(episode);
										let mediaQualityCode = mediaQualities[file.quality];
										let mediaTranslationCode = mediaLocalizations[file.translate];

										let hasHD = mediaQualityCode !== SD;
										let hasSubtitles = !!~subtitlesList.indexOf(mediaTranslationCode);
										let hasTranslation = !!~translationList.indexOf(mediaTranslationCode);

										let highlight = false;
										let title = processEntitiesInString(title_en);
										let description = processEntitiesInString(spoiler);

										if (this.props.episode) {
											highlight = episodeNumber === this.props.episode;
										} else if (!highlighted && !watched) {
											highlight = true;
											highlighted = true;
										}

										return (
											<listItemLockup
												autoHighlight={highlight ? 'true' : undefined}
												onSelect={this.onPlayEpisode.bind(this, episodeNumber)}
											>
												<ordinal minLength="3">{episodeNumber}</ordinal>
												<title style="tv-text-highlight-style: marquee-on-highlight">
													{title}
												</title>
												<subtitle>
													Translation: {hasTranslation ? 'Russian' : 'Original'}
												</subtitle>
												<decorationLabel>
													{this.state[`eid-${episodeNumber}`] && (
														<badge src="resource://button-checkmark" />
													)}
													{'  '}
													{hasSubtitles && (
														<badge src="resource://cc" />
													)}
													{hasSubtitles && '  '}
													{hasHD && (
														<badge src="resource://hd" />
													)}
												</decorationLabel>
												<relatedContent>
													<lockup>
														<img src={this.state.poster} style="tv-placeholder: tv" width="400" height="400" />
														<description
															handlesOverflow="true"
															style="margin: 40 0; tv-text-max-lines: 2"
															onSelect={this.onShowDescription.bind(this, {title, description})}
														>{description}</description>
														<row style="tv-align: center">
															{this.state[`eid-${episodeNumber}`] ? (
																<buttonLockup onSelect={this.onMarkAsNew.bind(this, episodeNumber)}>
																	<badge src="resource://button-remove" />
																	<title>Mark as New</title>
																</buttonLockup>
															) : (
																<buttonLockup onSelect={this.onMarkAsWatched.bind(this, episodeNumber)}>
																	<badge src="resource://button-add" />
																	<title>Mark as Seen</title>
																</buttonLockup>
															)}
														</row>
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

			onPlayEpisode(episodeNumber) {
				let {sid} = this.props;
				let {episodes, poster} = this.state;
				let markAsWatched = this.onMarkAsWatched.bind(this);

				let resolvers = {
					initial() {
						return episodeNumber;
					},

					next({id}) {
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
							return getEpisodeItem(sid, episode, poster);
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
				return markEpisodeAsUnWatched(sid, id, episodeNumber);
			},

			onMarkAsWatched(episodeNumber) {
				let {id, sid} = this.props;
				this.setState({[`eid-${episodeNumber}`]: true});
				return markEpisodeAsWatched(sid, id, episodeNumber);
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
		})));
}

function getEpisode(episodeNumber, episodes) {
	let [episode] = episodes.filter(({episode}) => episode === episodeNumber);
	return episode;
}

function getEpisodeItem(sid, episode, poster) {
	if (!episode) return null;

	let {
		season,
		spoiler,
		title_en,
		episode: episodeNumber,
		screenshots: {big: episodePoster},
	} = episode;

	let title = processEntitiesInString(title_en);
	let description = processEntitiesInString(spoiler);

	let id = [sid, season, episodeNumber].join('-');
	let file = getEpisodeMedia(episode);
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
