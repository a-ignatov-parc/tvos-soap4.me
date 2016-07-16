/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';

import {getDefault, quality} from '../quality';
import {link, fixSpecialSymbols} from '../utils';

const {SD, HD, FULLHD} = quality;

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.passthrough(({navigation: {tvshow, season}}) => ({tvshow, season})))
		.pipe(TVDML.render(({tvshow, season}) => {
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
					<listTemplate>
						<banner>
							<title>{title}</title>
						</banner>
						<list>
							<header>
								<title>Season {season.season}</title>
							</header>
							<section>
								{episodes.map(episode => {
									let {
										title_en,
										spoiler,
										watched,
										quality,
									} = episode;

									return (
										<listItemLockup onSelect={showEpisode(episode)}>
											<title style="tv-labels-state: marquee-on-highlight">
												{fixSpecialSymbols(title_en)}
											</title>
											<decorationLabel>
												{watched && <badge src="resource://button-checkmark" />}
												{' '}
												{!!~[FULLHD, HD].indexOf(quality) && <badge src="resource://hd" />}
											</decorationLabel>
											<relatedContent>
												<lockup>
													<img src={poster} width="400" height="400" />
													<description>{spoiler}</description>
												</lockup>
											</relatedContent>
										</listItemLockup>
									);
								})}
							</section>
						</list>
					</listTemplate>
				</document>
			);
		}));
}

function showEpisode(episode) {
	let {
		spoiler,
		watched,
		title_en,
		season_id,
	} = episode;

	let poster = `http://covers.soap4.me/season/big/${season_id}.jpg`;

	return (event) => {
		TVDML
			.renderModal(
				<document>
					<descriptiveAlertTemplate>
						<title>
							{title_en}
						</title>
						<img src={poster} width="400" height="400" />
						<description>
							{spoiler}
						</description>
						<row>
							<button onSelect={playEpisodeHandler(episode)}>
								<text>Play</text>
							</button>
							<button>
								<text>Mark As Played</text>
							</button>
						</row>
					</descriptiveAlertTemplate>
				</document>
			)
			.sink()
	}
}

function playEpisodeHandler(episode) {
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
