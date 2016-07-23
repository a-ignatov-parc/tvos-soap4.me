/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';

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

			let poster = `http://covers.soap4.me/season/big/${id}.jpg`;
			let episodes = season.episodes
				.filter(Boolean)
				.map(getDefault);
			let highlighted = false;

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
										title_en,
										spoiler,
										watched,
										quality,
										episode: episodeIndex,
									} = episode;

									let title = fixSpecialSymbols(title_en);
									let description = fixSpecialSymbols(spoilers[i]);
									let highlight = false;

									if (!highlighted && !watched) {
										highlight = true;
										highlighted = true;
									}

									return (
										<listItemLockup autoHighlight={highlight ? 'true' : undefined} onSelect={playEpisode(episode)}>
											<ordinal minLength="2">{episodeIndex}</ordinal>
											<title style="tv-labels-state: marquee-on-highlight">
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

function playEpisode(episode) {
	return (event) => {
		console.log('playEpisode', episode);

		let videoURL = 'http://www.rwdevcon.com/videos/Ray-Wenderlich-Teamwork.mp4';

		let player = new Player();
		let playlist = new Playlist();
		let mediaItem = new MediaItem('video', videoURL);

		player.playlist = playlist;
		player.playlist.push(mediaItem);
		player.present();
	}
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
