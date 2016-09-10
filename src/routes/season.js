/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';
import assign from 'object-assign';

import * as settings from '../settings';
import {qualityMapping} from '../quality';
import {link, fixSpecialSymbols} from '../utils';
import {processEntitiesInString} from '../utils/parser';

import {
	getTVShowSeason,
	getTVShowDescription,
} from '../request/soap';

import {
	markEpisodeAsWatched,
	markEpisodeAsUnWatched,
} from '../request/soap';

import Loader from '../components/loader';

const {Promise} = TVDML;
const {VIDEO_QUALITY} = settings.params;
const {SD, HD, FULLHD} = settings.values[VIDEO_QUALITY];

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
					result.watched[episode] = !!watched;
					return result;
				}, {
					poster,
					episodes,
					watched: {},
				});
			},

			render() {
				let highlighted = false;
				let {title} = this.props.tvshow;
				let {episodes} = this.state;

				console.log(1111, this.state);

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
											quality,
											translate,
											hasSubtitles,
											episode: episodeNumber,
										} = episode;

										let highlight = false;
										let title = title_en;
										let description = processEntitiesInString(spoiler);
										let translation = (translate || '').trim();

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
												{!hasSubtitles && (
													<subtitle>
														Translation: {translation}
													</subtitle>
												)}
												<decorationLabel>
													{this.state.watched[episodeNumber] && (
														<badge src="resource://button-checkmark" />
													)}
													{'  '}
													{hasSubtitles && (
														<badge src="resource://cc" />
													)}
													{hasSubtitles && '  '}
													{!!~[
														qualityMapping[HD],
														qualityMapping[FULLHD],
													].indexOf(quality) && (
														<badge src="resource://hd" />
													)}
												</decorationLabel>
												<relatedContent>
													<itemBanner>
														<heroImg src={this.state.poster} />
														<description
															moreLabel="more"
															allowsZooming="true"
															style="margin: 20 0 0"
															onSelect={this.onShowDescription.bind(this, {title, description})}
														>{description}</description>
														{this.state.watched[episodeNumber] ? (
															<row>
																<buttonLockup onSelect={this.onMarkAsNew.bind(this, episodeNumber)}>
																	<badge src="resource://button-remove" />
																	<title>Mark as New</title>
																</buttonLockup>
															</row>
														) : (
															<row>
																<buttonLockup onSelect={this.onMarkAsWatched.bind(this, episodeNumber)}>
																	<badge src="resource://button-add" />
																	<title>Mark as Seen</title>
																</buttonLockup>
															</row>
														)}
													</itemBanner>
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

			onPlayEpisode(eid) {
				let {episodes} = this.state;
				let markAsWatched = this.onMarkAsWatched.bind(this);

				let resolvers = {
					initial() {
						return eid;
					},

					next({eid}) {
						let episode = getEpisode(eid, episodes);
						let index = episodes.indexOf(episode);
						let nextEpisode = ~index ? episodes[index + 1] : {};
						return nextEpisode.eid || null;
					},
				};

				TVDML
					.createPlayer({
						items(item, request) {
							let id = resolvers[request] && resolvers[request](item);
							return getEpisodeItem(id, episodes);
						},

						markAsWatched({eid}) {
							if (!getActiveDocument()) {
								return markAsWatched(eid);
							}
						},

						uidResolver({eid}) {
							return eid;
						},
					})
					.then(player => player.play());
			},

			onMarkAsNew(eid) {
				this.setState({[eid]: false});
				return markEpisodeAsUnWatched(eid);
			},

			onMarkAsWatched(eid) {
				this.setState({[eid]: true});
				return markEpisodeAsWatched(eid);
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

function getEpisode(eid, episodes) {
	let [episode] = episodes.filter(({eid: id}) => eid === id);
	return episode;
}

function getEpisodeItem(id, episodes) {
	let episode = getEpisode(id, episodes);

	if (!episode) return null;

	let {
		eid,
		sid,
		hash,
		spoiler,
		title_en,
		season_id,
	} = episode;

	let poster = `http://covers.soap4.me/season/big/${season_id}.jpg`;

	return getEpisodeMediaURL(eid, sid, hash).then(url => ({
		eid,
		url,
		title: title_en,
		description: spoiler,
		artworkImageURL: poster,
	}));
}
