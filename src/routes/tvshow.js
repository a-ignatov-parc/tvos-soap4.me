/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';
import formatNumber from 'simple-format-number';

import {get} from '../request/soap';
import {getDefault} from '../quality';

import Tile from '../components/tile';
import Loader from '../components/loader';

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.passthrough(({navigation: {tvshow}}) => ({tvshow})))
		.pipe(TVDML.render(({tvshow: {title}}) => {
			return <Loader title={title} />;
		}))
		.pipe(TVDML.passthrough(({tvshow: {sid}}) => {
			return get(`https://soap4.me/api/episodes/${sid}/`).then(episodes => ({episodes}));
		}))
		.pipe(TVDML.render(({tvshow, episodes}) => {
			let {
				sid,
				year,
				title,
				imdb_votes,
				imdb_rating,
				kinopoisk_votes,
				kinopoisk_rating,
				description,
			} = tvshow;

			let poster = `http://covers.soap4.me/soap/big/${sid}.jpg`;

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

			console.log(111, tvshow, episodes, seasons);

			return (
				<document>
					<productBundleTemplate>
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
									onSelect={showFullDescription(tvshow)}
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
							<heroImg src={poster} />
						</banner>
						<shelf>
							<header>
								<title>Seasons</title>
							</header>
							<section>
								{seasons.map((season, i) => {
									let {id, episodes} = season;
									let poster = `http://covers.soap4.me/season/big/${id}.jpg`;
									let unwatched = episodes.reduce((result, episode) => {
										return result + +!getDefault(episode).watched;
									}, 0);

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
