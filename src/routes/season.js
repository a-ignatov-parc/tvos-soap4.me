/** @jsx TVDML.jsx */

import plur from 'plur';
import md5 from 'blueimp-md5';
import * as TVDML from 'tvdml';
import assign from 'object-assign';
import {get as getToken} from '../token';

import {post} from '../request/soap';
import {parseTVShowSeasonPage} from '../info';
import {getDefault, quality} from '../quality';
import {link, fixSpecialSymbols} from '../utils';

import Loader from '../components/loader';

const {SD, HD, FULLHD} = quality;

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.passthrough(({navigation: {tvshow, season}}) => ({tvshow, season})))
		.pipe(TVDML.render(({season: {season}}) => {
			return <Loader title={`Season ${season}`} />;
		}))
		.pipe(TVDML.passthrough(({tvshow, season: {season}}) => {
			return parseTVShowSeasonPage(tvshow, season).then(({spoilers}) => ({spoilers}));
		}))
		.pipe(TVDML.render(({tvshow, season, spoilers}) => {
			let {
				sid,
				title,
				description,
			} = tvshow;

			let {
				id,
			} = season;

			let highlighted = false;
			let poster = `http://covers.soap4.me/season/big/${id}.jpg`;
			let episodes = season.episodes
				.filter(Boolean)
				.map(getDefault)
				.map((episode, i) => assign({}, episode, {spoiler: spoilers[i]}));

			console.log('season', tvshow, season, spoilers);

			return (
				<document>
					<compilationTemplate theme="light">
						<background>
							<heroImg src={poster} />
						</background>
						<list>
							<header>
								<title>{title}</title>
								<subtitle>Season {season.season}</subtitle>
							</header>
							<section>
								{episodes.map((episode, i) => {
									let {
										eid,
										title_en,
										spoiler,
										watched,
										quality,
										episode: episodeIndex,
									} = episode;

									let title = fixSpecialSymbols(title_en);
									let description = fixSpecialSymbols(spoiler);
									let highlight = false;

									if (!highlighted && !watched) {
										highlight = true;
										highlighted = true;
									}

									return (
										<listItemLockup autoHighlight={highlight ? 'true' : undefined} onSelect={playEpisode(eid, episodes)}>
											<ordinal minLength="2">{episodeIndex}</ordinal>
											<title style="tv-text-highlight-style: marquee-on-highlight">
												{title}
											</title>
											<decorationLabel>
												{watched && (
													<badge src="resource://button-checkmark" />
												)}
												{'  '}
												{!!~[FULLHD, HD].indexOf(quality) && <badge src="resource://hd" />}
											</decorationLabel>
											<relatedContent>
												<itemBanner>
													<heroImg src={poster} />
													<description
														moreLabel="more"
														allowsZooming="true"
														style="margin: 20 0 0"
														onSelect={showDescription({title, description})}
													>{description}</description>
													<Controls
														partial={`episode-${episodeIndex}`}
														scenario={watched ? 'watched' : 'not-watched'}
													/>
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
		}))
		.pipe(TVDML.passthrough(({document: {partials}}) => {
			let actions = {
				add(controls) {
					controls.update(<Controls scenario="watched" />);
				},

				remove(controls) {
					controls.update(<Controls scenario="not-watched" />);
				},
			};

			Object
				.keys(partials)
				.map(name => ({name, controls: partials[name]}))
				.forEach(({name, controls}) => {
					controls.onSelect((event) => {
						let {target} = event;
						let action = actions[target.getAttribute('id')];
						event.stopPropagation();
						action && action(controls);
					});
				});
		}));
}

function playEpisode(eid, episodes) {
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

	return () => {
		TVDML
			.createPlayer({
				items(item, request) {
					let id = resolvers[request] && resolvers[request](item);
					return getEpisodeItem(id, episodes);
				},

				markAsWatched({eid}) {
					let token = getToken();
					let payload = {
						eid,
						token,
						what: 'mark_watched',
					};

					return post('https://soap4.me/callback/', payload);
				},

				uidResolver({eid}) {
					return eid;
				},
			})
			.then(player => player.play());
	}
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
		spoiler,
		title_en,
		season_id,
		hash: episodeHash,
	} = episode;

	let poster = `http://covers.soap4.me/season/big/${season_id}.jpg`;

	let token = getToken();
	let hash = md5(token + eid + sid + episodeHash);
	let payload = {
		eid,
		hash,
		token,
		do: 'load',
		what: 'player',
	};

	return post('https://soap4.me/callback/', payload).then(({server}) => ({
		eid,
		title: title_en,
		description: spoiler,
		artworkImageURL: poster,
		url: `https://${server}.soap4.me/${token}/${eid}/${hash}/`,
	}));
}

function showDescription({title, description}) {
	return (event) => {
		event.stopPropagation();

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
			.sink()
	}
}

function Controls({attrs = {}}) {
	let {
		partial,
		scenario = 'not-watched',
	} = attrs;

	let scenarios = {
		'watched': [
			{
				id: 'remove',
				title: 'Mark as New',
				badge: 'resource://button-remove',
			},
		],
		'not-watched': [
			{
				id: 'add',
				title: 'Mark as Watched',
				badge: 'resource://button-add',
			},
		],
	};

	return (
		<row partial={partial}>
			{scenarios[scenario].map(({id, title, badge}) => (
				<buttonLockup id={id}>
					<badge src={badge} />
					<title>{title}</title>
				</buttonLockup>
			))}
		</row>
	);
}
