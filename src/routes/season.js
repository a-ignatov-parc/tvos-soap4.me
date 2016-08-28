/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';
import assign from 'object-assign';

import * as settings from '../settings';
import {get as getToken} from '../token';
import {qualityMapping} from '../quality';
import {parseTVShowSeasonPage} from '../info';
import {link, fixSpecialSymbols} from '../utils';
import {getResolvedSeasonEpisodes} from '../request/soap';

import {
	getTVShow,
	getTVShowSeason,
	getEpisodeMediaURL,
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
					getTVShow(sid),
					getTVShowSeason(sid, id),
				])
				.then(([tvshow, season]) => ({tvshow, season}));
		}))
		.pipe(TVDML.passthrough(({tvshow, season: {season}}) => {
			return parseTVShowSeasonPage(tvshow, season).then(({spoilers}) => ({spoilers}));
		}))
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				let episodes = getResolvedSeasonEpisodes(this.props.season)
					.map((episode, i) => assign({}, episode, {
						spoiler: this.props.spoilers[i],
					}));

				return episodes.reduce((result, {eid, watched}) => {
					result[eid] = !!watched;
					return result;
				}, {
					episodes,
					poster: `http://covers.soap4.me/season/big/${this.props.id}.jpg`,
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
											eid,
											title_en,
											spoiler,
											watched,
											quality,
											translate,
											hasSubtitles,
											episode: episodeIndex,
										} = episode;

										let highlight = false;
										let title = fixSpecialSymbols(title_en);
										let description = fixSpecialSymbols(spoiler);
										let translation = (translate || '').trim();

										if (this.props.episode) {
											highlight = episodeIndex === this.props.episode;
										} else if (!highlighted && !watched) {
											highlight = true;
											highlighted = true;
										}

										return (
											<listItemLockup
												autoHighlight={highlight ? 'true' : undefined}
												onSelect={this.onPlayEpisode.bind(this, eid)}
											>
												<ordinal minLength="3">{episodeIndex}</ordinal>
												<title style="tv-text-highlight-style: marquee-on-highlight">
													{title}
												</title>
												{!hasSubtitles && (
													<subtitle>
														Translation: {translation}
													</subtitle>
												)}
												<decorationLabel>
													{this.state[eid] && (
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
														{this.state[eid] ? (
															<row>
																<buttonLockup onSelect={this.onMarkAsNew.bind(this, eid)}>
																	<badge src="resource://button-remove" />
																	<title>Mark as New</title>
																</buttonLockup>
															</row>
														) : (
															<row>
																<buttonLockup onSelect={this.onMarkAsWatched.bind(this, eid)}>
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
