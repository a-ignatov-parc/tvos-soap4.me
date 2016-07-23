/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';
import formatNumber from 'simple-format-number';

import {get} from '../request/soap';
import {getDefault} from '../quality';
import {capitalizeText} from '../utils';
import {parseTVShowPage} from '../info';

import Tile from '../components/tile';
import Loader from '../components/loader';

const {Promise} = TVDML;

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.passthrough(({navigation: {tvshow}}) => ({tvshow})))
		.pipe(TVDML.render(({tvshow: {title}}) => {
			return <Loader title={title} />;
		}))
		.pipe(TVDML.passthrough(({tvshow: {sid}}) => {
			return Promise
				.all([
					get(`https://soap4.me/api/soap/`),
					get(`https://soap4.me/api/episodes/${sid}/`),
				])
				.then(([series, episodes]) => ({series, episodes}));
		}))
		.pipe(TVDML.passthrough(({tvshow}) => {
			return parseTVShowPage(tvshow).then(extra => ({extra}));
		}))
		.pipe(TVDML.passthrough(({episodes}) => ({
			seasons: episodes.reduce((result, item) => {
				let seasonIndex = item.season - 1;
				let episodeIndex = item.episode;

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
			}, []),
		})))
		.pipe(TVDML.render(({tvshow, episodes, extra, series, seasons}) => {
			let {
				sid,
				year,
				title,
				watching,
				imdb_votes,
				imdb_rating,
				description,
				kinopoisk_votes,
				kinopoisk_rating,
			} = tvshow;

			let {
				genres,
				status,
				actors,
				country,
				duration,
				recomendations,
			} = extra;

			let isWatching = watching > 0;
			let poster = `http://covers.soap4.me/soap/big/${sid}.jpg`;

			console.log('tvshow', tvshow, episodes, seasons, extra, series);

			return (
				<document>
					<productTemplate theme="light">
						<banner>
							<infoList>
								<info>
									<header>
										<title>Status</title>
									</header>
									<text>{capitalizeText(status)}</text>
								</info>
								<info>
									<header>
										<title>Genres</title>
									</header>
									{genres.map(capitalizeText).map(genre => {
										return <text>{genre}</text>;
									})}
								</info>
								<info>
									<header>
										<title>Actors</title>
									</header>
									{actors.map(actor => {
										return <text>{actor}</text>;
									})}
								</info>
							</infoList>
							<stack>
								<title>{title}</title>
								<row>
									<text>{duration}</text>
									<text>{year}</text>
								</row>
								<description
									allowsZooming="true"
									moreLabel="more"
									onSelect={showFullDescription(tvshow)}
								>{description}</description>
								<Controls
									partial="controls"
									scenario={isWatching ? 'subscribed' : 'not-subscribed'}
								/>
							</stack>
							<heroImg src={poster} />
						</banner>
						<shelf>
							<header>
								<title>Seasons</title>
							</header>
							<section>
								{seasons.map(season => {
									let {id} = season;
									let poster = `http://covers.soap4.me/season/big/${id}.jpg`;
									let unwatched = calculateUnwatchedCount(season);

									return (
										<Tile
											route="season"
											poster={poster}
											payload={{tvshow, season}}
											title={`Season ${season.season}`}
											subtitle={unwatched && `${unwatched} ${plur('episode', unwatched)}`}
										/>
									);
								})}
							</section>
						</shelf>
						<shelf>
							<header>
								<title>Viewers Also Watched</title>
							</header>
							<section>
								{recomendations.map(recomendation => {
									let {sid} = recomendation;
									let poster = `http://covers.soap4.me/soap/big/${sid}.jpg`;
									let tvshow;

									series.some((item) => {
										if (item.sid === sid) {
											tvshow = item;
											return true;
										}
									});

									if (!tvshow) return null;

									let {title} = tvshow;

									return (
										<Tile
											title={title}
											poster={poster}
											route="tvshow"
											payload={{tvshow}}
										/>
									);
								})}
							</section>
						</shelf>
						<shelf>
							<header>
								<title>Ratings</title>
							</header>
							<section>
								{!!+imdb_rating && (
									<ratingCard>
										<title>{(`${imdb_rating}`).slice(0, 3)} / 10</title>
										<ratingBadge value={imdb_rating / 10} />
										<description>
											Average of {formatNumber(+imdb_votes, {fractionDigits: 0})} IMDB user ratings.
										</description>
									</ratingCard>
								)}
								{!!+kinopoisk_rating && (
									<ratingCard>
										<title>{(`${kinopoisk_rating}`).slice(0, 3)} / 10</title>
										<ratingBadge value={kinopoisk_rating / 10} />
										<description>
											Average of {formatNumber(+kinopoisk_votes, {fractionDigits: 0})} Kinopoisk user ratings.
										</description>
									</ratingCard>
								)}
							</section>
						</shelf>
					</productTemplate>
				</document>
			);
		}))
		.pipe(TVDML.passthrough(({tvshow, seasons, document: {partials: {controls}}}) => {
			let season = seasons.reduce((result, season) => {
				if (!result && calculateUnwatchedCount(season)) return season;
				return result;
			}, null);

			let actions = {
				play() {
					TVDML.navigate('season', {tvshow, season})
				},

				add() {
					controls.update(<Controls scenario="subscribed" />);
				},

				remove() {
					controls.update(<Controls scenario="not-subscribed" />);
				},
			};

			controls.onSelect(({target}) => {
				let action = actions[target.getAttribute('id')];
				action && action();
			});
		}));
}

function calculateUnwatchedCount({episodes}) {
	return episodes.reduce((result, episode) => result + +!getDefault(episode).watched, 0);
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

function Controls({attrs = {}}) {
	let {
		partial,
		scenario = 'not-subscribed',
	} = attrs;

	let scenarios = {
		'subscribed': [
			{
				id: 'play',
				title: 'Continue Watching',
				badge: 'resource://button-play',
			}, {
				id: 'remove',
				title: 'Stop Watching',
				badge: 'resource://button-remove',
			},
		],
		'not-subscribed': [
			{
				id: 'add',
				title: 'Watch',
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
