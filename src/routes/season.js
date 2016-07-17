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

			let episodes = season.episodes.map(getDefault);
			let poster = `http://covers.soap4.me/season/big/${id}.jpg`;

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
								{episodes.map(episode => {
									let {
										title_en,
										spoiler,
										watched,
										quality,
										episode: episodeIndex,
									} = episode;

									let title = fixSpecialSymbols(title_en);
									let description = fixSpecialSymbols(spoilers[episodeIndex - 1]);

									return (
										<listItemLockup onSelect={playEpisode(episode)}>
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
													<row>
														{watched ? (
															<buttonLockup>
																<badge src="resource://button-remove"/>
																<title>Mark as New</title>
															</buttonLockup>
														) : (
															<buttonLockup>
																<badge src="resource://button-add"/>
																<title>Mark as Watched</title>
															</buttonLockup>
														)}
													</row>
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
		}));
}

function playEpisode(episode) {
	return (event) => {
		console.log(222, episode);

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
