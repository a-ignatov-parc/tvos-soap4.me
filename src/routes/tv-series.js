/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';
import formatNumber from 'simple-format-number';

import {get} from '../request/soap';

import Loader from '../components/loader';

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.passthrough(({navigation: {TVSeries}}) => ({TVSeries})))
		.pipe(TVDML.render(({TVSeries: {title}}) => {
			return <Loader title={title} />;
		}))
		.pipe(TVDML.passthrough(({TVSeries: {sid}}) => {
			return get(`https://soap4.me/api/episodes/${sid}/`).then(episodes => ({episodes}));
		}))
		.pipe(TVDML.render(({TVSeries, episodes}) => {
			let {
				sid,
				year,
				title,
				imdb_votes,
				imdb_rating,
				kinopoisk_votes,
				kinopoisk_rating,
				description,
			} = TVSeries;

			let posterUrl = `http://covers.soap4.me/soap/big/${sid}.jpg`;

			let seasons = episodes.reduce((result, item) => {
				let seasonIndex = item.season - 1;
				let episodeIndex = item.episode - 1;

				if (!result[seasonIndex]) {
					result[seasonIndex] = {
						id: item.season_id,
						season: item.season,
						episodes: [],
						subtitles: [],
					};
				}

				let episodeCollection = result[seasonIndex].episodes;

				if (~item.translate.toLowerCase().indexOf('субтитры')) {
					episodeCollection = result[seasonIndex].subtitles;
				}

				if (!episodeCollection[episodeIndex]) {
					episodeCollection[episodeIndex] = {};
				}
				episodeCollection[episodeIndex][item.quality] = item;
				return result;
			}, []);

			console.log(111, TVSeries, episodes, seasons);

			return (
				<document>
					<productBundleTemplate>
						<background />
						<banner>
							<stack>
								<title>{title}</title>
								<row>
									<ratingBadge value={imdb_rating / 10} />
									<text>{year}</text>
								</row>
								<description
									allowsZooming="true"
									moreLabel="more"
									onSelect={showFullDescription(TVSeries)}
								>
									{description}
								</description>
								<row>
									<buttonLockup>
										<badge src="resource://button-add" />
										<title>Add to My Series</title>
									</buttonLockup>
								</row>
							</stack>
							<heroImg src={posterUrl} />
						</banner>
						<shelf style="padding: 0 90 60">
							<header>
								<title>Seasons</title>
							</header>
							<section>
								{seasons.map((season, i) => {
									let {id, episodes} = season;
									let posterUrl = `http://covers.soap4.me/season/big/${id}.jpg`;
									let unwatched = episodes.reduce((result, episode) => {
										return result + +!episode.SD.watched;
									}, 0);

									return (
										<lockup>
											<img src={posterUrl} width="250" height="250" />
											<title>Season {i + 1}</title>
											<title>
												{unwatched && `${unwatched} ${plur('episode', unwatched)}`}
											</title>
										</lockup>
									);
								})}
							</section>
						</shelf>
						<shelf>
							<header>
								<title>Ratings</title>
							</header>
							<section>
								<ratingCard>
									<title>{(`${imdb_rating}`).slice(0, 3)} / 10</title>
									<ratingBadge value={imdb_rating / 10} />
									<description>
										Average of {formatNumber(+imdb_votes, {fractionDigits: 0})} IMDB user ratings.
									</description>
								</ratingCard>
								<ratingCard>
									<title>{(`${kinopoisk_rating}`).slice(0, 3)} / 10</title>
									<ratingBadge value={kinopoisk_rating / 10} />
									<description>
										Average of {formatNumber(+kinopoisk_votes, {fractionDigits: 0})} Kinopoisk user ratings.
									</description>
								</ratingCard>
							</section>
						</shelf>
					</productBundleTemplate>
				</document>
			);
		}));
}

function showFullDescription({title, description}) {
	return (event) => {
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
