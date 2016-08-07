/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';
import formatNumber from 'simple-format-number';

import {getDefault} from '../quality';
import {parseTVShowPage} from '../info';
import {link, capitalizeText} from '../utils';
import {getActor, getActorPhoto} from '../info/tmdb';
import {
	getTVShow,
	addToMyTVShows,
	getTVShowSeasons,
	removeFromMyTVShows,
} from '../request/soap';

import Tile from '../components/tile';
import Loader from '../components/loader';

const {Promise} = TVDML;

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.passthrough(({navigation: {sid, title}}) => ({sid, title})))
		.pipe(TVDML.render(({title}) => {
			return <Loader title={title} />;
		}))
		.pipe(TVDML.passthrough(({sid}) => {
			return Promise
				.all([
					getTVShow(sid),
					getTVShowSeasons(sid),
				])
				.then(([tvshow, seasons]) => ({tvshow, seasons}));
		}))
		.pipe(TVDML.passthrough(({tvshow}) => {
			return parseTVShowPage(tvshow).then(extra => ({extra}));
		}))
		.pipe(TVDML.passthrough(({extra: {actors}}) => {
			return Promise
				.all(actors.map(getActor))
				.then(actorsProfiles => actorsProfiles.reduce((result, actor, i) => {
					if (actor) result[actors[i]] = getActorPhoto(actor);
					return result;
				}, {}))
				.then(actorsPhotos => ({actorsPhotos}));
		}))
		.pipe(TVDML.createComponent({
			getInitialState() {
				return {
					watching: this.props.tvshow.watching > 0,
					poster: `http://covers.soap4.me/soap/big/${this.props.sid}.jpg`,
				};
			},

			render() {
				return (
					<document>
						<productTemplate theme="light">
							<banner>
								{this.renderStatus()}
								{this.renderInfo()}
								<heroImg src={this.state.poster} />
							</banner>
							{this.renderSeasons()}
							{this.renderRecomendations()}
							{this.renderRatings()}
							{this.renderCrew()}
							{this.renderAdditionalInfo()}
						</productTemplate>
					</document>
				);
			},

			renderStatus() {
				let {status, genres, actors} = this.props.extra;

				return (
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
				);
			},

			renderInfo() {
				let {title, description} = this.props.tvshow;
				let {count} = this.props.extra;

				return (
					<stack>
						<title>{title}</title>
						<row>
							<text>Watched by {count > 0 ? `${count} people` : `no one`}</text>
						</row>
						<description
							allowsZooming="true"
							moreLabel="more"
							onSelect={this.onShowFullDescription}
						>{description}</description>
						{this.state.watching ? (
							<row>
								<buttonLockup onSelect={this.onContinueWatching}>
									<badge src="resource://button-play" />
									<title>Continue Watching</title>
								</buttonLockup>
								<buttonLockup onSelect={this.onRemoveFromSubscription}>
									<badge src="resource://button-remove" />
									<title>Stop Watching</title>
								</buttonLockup>
							</row>
						) : (
							<row>
								<buttonLockup onSelect={this.onAddToSubscription}>
									<badge src="resource://button-add" />
									<title>Start Watching</title>
								</buttonLockup>
							</row>
						)}
					</stack>
				);
			},

			renderSeasons() {
				let {sid, title} = this.props.tvshow;

				return (
					<shelf>
						<header>
							<title>Seasons</title>
						</header>
						<section>
							{this.props.seasons.map(season => {
								let {id} = season;
								let seasonTitle = `Season ${season.season}`;
								let poster = `http://covers.soap4.me/season/big/${id}.jpg`;
								let unwatched = calculateUnwatchedCount(season);

								return (
									<Tile
										title={seasonTitle}
										route="season"
										poster={poster}
										payload={{sid, id, title: `${title} — ${seasonTitle}`}}
										subtitle={!!unwatched && `${unwatched} ${plur('episode', unwatched)}`}
									/>
								);
							})}
						</section>
					</shelf>
				);
			},

			renderRecomendations() {
				let {recomendations} = this.props.extra;

				return (
					<shelf>
						<header>
							<title>Viewers Also Watched</title>
						</header>
						<section>
							{recomendations.map(({sid, title}) => {
								let poster = `http://covers.soap4.me/soap/big/${sid}.jpg`;

								return (
									<Tile
										title={title}
										poster={poster}
										route="tvshow"
										payload={{sid, title}}
									/>
								);
							})}
						</section>
					</shelf>
				);
			},

			renderRatings() {
				let {
					imdb_votes,
					imdb_rating,
					kinopoisk_votes,
					kinopoisk_rating,
				} = this.props.tvshow;
				let {reviews} = this.props.extra;

				return (
					<shelf>
						<header>
							<title>Ratings and Reviews</title>
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
							{reviews.map(review => {
								let {user, date, text} = review;
								return (
									<reviewCard onSelect={this.onShowFullReview.bind(this, review)}>
										<title>{user}</title>
										<description>{text}</description>
										<text>{date}</text>
									</reviewCard>
								);
							})}
						</section>
					</shelf>
				);
			},

			renderCrew() {
				let {actors} = this.props.extra;

				return (
					<shelf>
						<header>
							<title>Cast and Crew</title>
						</header>
						<section>
							{actors.map(name => {
								let [firstName, lastName] = name.split(' ');

								return (
									<monogramLockup onSelect={link('actor', {actor: name})}>
										<monogram 
											src={this.props.actorsPhotos[name]}
											firstName={firstName}
											lastName={lastName}
										/>
										<title>{name}</title>
										<subtitle>Actor</subtitle>
									</monogramLockup>
								);
							})}
						</section>
					</shelf>
				);
			},

			renderAdditionalInfo() {
				let {year} = this.props.tvshow;
				let {duration, country, runtime} = this.props.extra;

				return (
					<productInfo>
						<infoTable>
							<header>
								<title>Information</title>
							</header>
							<info>
								<header>
									<title>Year</title>
								</header>
								<text>{year}</text>
							</info>
							<info>
								<header>
									<title>Country</title>
								</header>
								<text>{country}</text>
							</info>
							<info>
								<header>
									<title>Runtime</title>
								</header>
								<text>{runtime}</text>
							</info>
							<info>
								<header>
									<title>Duration</title>
								</header>
								<text>{duration}</text>
							</info>
						</infoTable>
						<infoTable>
							<header>
								<title>Languages</title>
							</header>
							<info>
								<header>
									<title>Primary</title>
								</header>
								<text>Russian, English</text>
							</info>
						</infoTable>
					</productInfo>
				);
			},

			onContinueWatching() {
				let uncompletedSeason = this.props.seasons.reduce((result, season) => {
					if (!result && calculateUnwatchedCount(season)) return season;
					return result;
				}, null);

				let {sid, title} = this.props.tvshow;
				let {id, season} = uncompletedSeason;

				TVDML.navigate('season', {sid, id, title: `${title} — Season ${season}`});
			},

			onAddToSubscription() {
				let {sid} = this.props.tvshow;
				this.setState({watching: true});
				return addToMyTVShows(sid);
			},

			onRemoveFromSubscription() {
				let {sid} = this.props.tvshow;
				this.setState({watching: false});
				return removeFromMyTVShows(sid);
			},

			onShowFullDescription() {
				let {title, description} = this.props.tvshow;

				TVDML
					.renderModal(
						<document>
							<descriptiveAlertTemplate>
								<title>{title}</title>
								<description>{description}</description>
							</descriptiveAlertTemplate>
						</document>
					)
					.sink();
			},

			onShowFullReview({user, text}) {
				TVDML
					.renderModal(
						<document>
							<descriptiveAlertTemplate>
								<title>{user}</title>
								<description>{text}</description>
							</descriptiveAlertTemplate>
						</document>
					)
					.sink();
			},
		}));
}

function calculateUnwatchedCount({episodes}) {
	return episodes.reduce((result, episode) => result + +!getDefault(episode).watched, 0);
}
