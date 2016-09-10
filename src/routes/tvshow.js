/** @jsx TVDML.jsx */

import plur from 'plur';
import moment from 'moment';
import * as TVDML from 'tvdml';
import assign from 'object-assign';
import formatNumber from 'simple-format-number';

import {processEntitiesInString} from '../utils/parser';
import {deepEqualShouldUpdate} from '../utils/components';

import {
	link,
	capitalizeText,
	isMenuButtonPressNavigatedTo,
} from '../utils';

import {
	TVShowStatuses,
	getTVShowSeasons,
	getTVShowReviews,
	getTVShowDescription,
	getTVShowRecommendations,
} from '../request/soap';

import {
	addToMyTVShows,
	removeFromMyTVShows,
} from '../request/soap';

import Tile from '../components/tile';
import Loader from '../components/loader';

const {Promise} = TVDML;

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.passthrough(({navigation: {sid, title}}) => ({sid, title})))
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				return {
					loading: true,
					watching: false,
					continueWatching: false,
				};
			},

			componentDidMount() {
				let {sid} = this.props;
				let currentDocument = this._rootNode.ownerDocument;

				this.menuButtonPressPipeline = TVDML
					.subscribe('menu-button-press')
					.pipe(isMenuButtonPressNavigatedTo(currentDocument))
					.pipe(isNavigated => isNavigated && this.loadData(sid).then(this.setState.bind(this)));

				this.loadData(sid).then(payload => {
					this.setState(assign({loading: false}, payload));
				});
			},

			componentWillUnmount() {
				this.menuButtonPressPipeline.unsubscribe();
			},

			shouldComponentUpdate: deepEqualShouldUpdate,

			loadData(sid) {
				return Promise
					.all([
						getTVShowSeasons(sid),
						getTVShowReviews(sid),
						getTVShowDescription(sid),
						getTVShowRecommendations(sid),
					])
					.then(([
						seasons,
						reviews,
						tvshow,
						recomendations,
					]) => ({
						tvshow,
						reviews,
						seasons,
						recomendations,
					}))
					.then(payload => assign({
						watching: payload.tvshow.watching > 0,
						continueWatching: !!this.getSeasonToWatch(payload.seasons),
					}, payload));
			},

			render() {
				if (this.state.loading) {
					return <Loader title={this.props.title} />
				}

				return (
					<document>
						<productTemplate theme="light">
							<banner>
								{this.renderStatus()}
								{this.renderInfo()}
								<heroImg src={this.state.tvshow.covers.big} />
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
				let {status, genres, actors} = this.state.tvshow;

				return (
					<infoList>
						<info>
							<header>
								<title>Status</title>
							</header>
							<text>{TVShowStatuses[status]}</text>
						</info>
						<info>
							<header>
								<title>Genres</title>
							</header>
							{genres.map(capitalizeText).map(genre => {
								return <text key={genre}>{genre}</text>;
							})}
						</info>
						<info>
							<header>
								<title>Actors</title>
							</header>
							{actors.map(({person_en}) => {
								return <text key={person_en}>{person_en}</text>;
							})}
						</info>
					</infoList>
				);
			},

			renderInfo() {
				let {title, description, likes} = this.state.tvshow;
				let buttons = <row />;

				let continueWatchingBtn = (
					<buttonLockup onSelect={this.onContinueWatching}>
						<badge src="resource://button-play" />
						<title>Continue Watching</title>
					</buttonLockup>
				);

				let startWatchingBtn = (
					<buttonLockup onSelect={this.onAddToSubscription}>
						<badge src="resource://button-add" />
						<title>Start Watching</title>
					</buttonLockup>
				);

				let stopWatchingBtn = (
					<buttonLockup onSelect={this.onRemoveFromSubscription}>
						<badge src="resource://button-remove" />
						<title>Stop Watching</title>
					</buttonLockup>
				);

				if (this.state.watching) {
					buttons = (
						<row>
							{this.state.continueWatching && continueWatchingBtn}
							{stopWatchingBtn}
						</row>
					);
				} else {
					buttons = (
						<row>
							{startWatchingBtn}
						</row>
					);
				}

				return (
					<stack>
						<title>{title}</title>
						<row>
							<text>Liked by {likes > 0 ? `${likes} people` : `no one`}</text>
						</row>
						<description
							allowsZooming="true"
							moreLabel="more"
							onSelect={this.onShowFullDescription}
						>{description}</description>
						{buttons}
					</stack>
				);
			},

			renderSeasons() {
				let {sid, title} = this.state.tvshow;

				return (
					<shelf>
						<header>
							<title>Seasons</title>
						</header>
						<section>
							{this.state.seasons.map(season => {
								let {
									season: seasonNumber,
									covers: {big: poster},
								} = season;

								let seasonTitle = `Season ${seasonNumber}`;
								let unwatched = calculateUnwatchedCount(season);

								return (
									<Tile
										key={seasonNumber}
										title={seasonTitle}
										route="season"
										poster={poster}
										payload={{sid, id: seasonNumber, title: `${title} — ${seasonTitle}`}}
										subtitle={!!unwatched && `${unwatched} ${plur('episode', unwatched)}`}
									/>
								);
							})}
						</section>
					</shelf>
				);
			},

			renderRecomendations() {
				return (
					<shelf>
						<header>
							<title>Viewers Also Watched</title>
						</header>
						<section>
							{this.state.recomendations.map(({sid, title, covers: {big: poster}}) => {
								return (
									<Tile
										key={sid}
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
				} = this.state.tvshow;

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
							{this.state.reviews.map(review => {
								let {
									id,
									user,
									date,
									text,
									review_likes,
									review_dislikes,
								} = review;

								return (
									<reviewCard
										key={id}
										onSelect={this.onShowFullReview.bind(this, review)}
									>
										<title>{user}</title>
										<description>
											{moment(date * 1000).format('lll')}
											{'\n\n'}
											{processEntitiesInString(text)}
										</description>
										<text>{review_likes} 👍 / {review_dislikes} 👎</text>
									</reviewCard>
								);
							})}
						</section>
					</shelf>
				);
			},

			renderCrew() {
				return (
					<shelf>
						<header>
							<title>Cast and Crew</title>
						</header>
						<section>
							{this.state.tvshow.actors.map(actor => {
								let {
									person_id,
									person_en,
									person_image_original,
								} = actor;

								let [firstName, lastName] = person_en.split(' ');

								return (
									<monogramLockup
										key={person_id}
										onSelect={link('actor', {id: person_id, actor: person_en})}
									>
										<monogram 
											src={person_image_original}
											firstName={firstName}
											lastName={lastName}
										/>
										<title>{person_en}</title>
										<subtitle>Actor</subtitle>
									</monogramLockup>
								);
							})}
						</section>
					</shelf>
				);
			},

			renderAdditionalInfo() {
				let {
					year,
					country,
					network,
					episode_runtime,
				} = this.state.tvshow;

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
									<title>Runtime</title>
								</header>
								<text>{episode_runtime} min</text>
							</info>
							<info>
								<header>
									<title>Country</title>
								</header>
								<text>{country}</text>
							</info>
							<info>
								<header>
									<title>Network</title>
								</header>
								<text>{network}</text>
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

			getSeasonToWatch(seasons = []) {
				return seasons.reduce((result, season) => {
					if (!result && calculateUnwatchedCount(season)) return season;
					return result;
				}, null);
			},

			onContinueWatching() {
				let uncompletedSeason = this.getSeasonToWatch(this.state.seasons);
				let {season: seasonNumber} = uncompletedSeason;
				let seasonTitle = `Season ${seasonNumber}`;
				let {sid, title} = this.state.tvshow;

				TVDML.navigate('season', {sid, id: seasonNumber, title: `${title} — ${seasonTitle}`});
			},

			onAddToSubscription() {
				let {sid} = this.state.tvshow;
				this.setState({watching: true});
				return addToMyTVShows(sid);
			},

			onRemoveFromSubscription() {
				let {sid} = this.state.tvshow;
				this.setState({watching: false});
				return removeFromMyTVShows(sid);
			},

			onShowFullDescription() {
				let {title, description} = this.state.tvshow;

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
								<description>{processEntitiesInString(text)}</description>
							</descriptiveAlertTemplate>
						</document>
					)
					.sink();
			},
		})));
}

function calculateUnwatchedCount(season) {
	return season.unwatched || 0;
}
