/** @jsx TVDML.jsx */

import moment from 'moment';
import * as TVDML from 'tvdml';
import assign from 'object-assign';
import formatNumber from 'simple-format-number';

import * as user from '../user';
import {processEntitiesInString} from '../utils/parser';
import {deepEqualShouldUpdate} from '../utils/components';

import {
	link,
	capitalizeText,
	isMenuButtonPressNavigatedTo,
} from '../utils';

import {
	TVShowStatuses,
	TVShowStatusStrings,
	getEpisodeMedia,
	getTrailerStream,
	getCountriesList,
	getTVShowSeasons,
	getTVShowReviews,
	getTVShowTrailers,
	getTVShowSchedule,
	getTVShowDescription,
	getTVShowRecommendations,
	markTVShowAsWatched,
	markTVShowAsUnwatched,
	markReviewAsLiked,
	markReviewAsDisliked,
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
				let authorized = user.isAuthorized();

				return {
					authorized,
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
					.pipe(isNavigated => isNavigated && this.loadData().then(this.setState.bind(this)));

				this.userStateChangePipeline = user
					.subscription()
					.pipe(() => this.setState({
						authorized: user.isAuthorized(),
					}));

				// To improuve UX on fast request we are adding rendering timeout.
				let waitForAnimations = new Promise((resolve) => setTimeout(resolve, 500));

				Promise
					.all([this.loadData(), waitForAnimations])
					.then(([payload]) => this.setState(assign({loading: false}, payload)));
			},

			componentWillUnmount() {
				this.menuButtonPressPipeline.unsubscribe();
				this.userStateChangePipeline.unsubscribe();
			},

			shouldComponentUpdate: deepEqualShouldUpdate,

			loadData() {
				let {sid} = this.props;

				return Promise
					.all([
						getCountriesList(),
						getTVShowSeasons(sid),
						getTVShowSchedule(sid),
						getTVShowDescription(sid),
						getTVShowRecommendations(sid),
					])
					.then(([
						contries,
						seasons,
						schedule,
						tvshow,
						recomendations,
					]) => Promise
						.all([
							tvshow.reviews > 0 ? getTVShowReviews(sid) : Promise.resolve([]),
							tvshow.trailers > 0 ? getTVShowTrailers(sid) : Promise.resolve([]),
						])
						.then(([reviews, trailers]) => ({
							tvshow,
							reviews,
							seasons,
							schedule,
							trailers,
							contries,
							recomendations,
						}))
					)
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
							<text>{TVShowStatusStrings[TVShowStatuses[status]]}</text>
						</info>
						<info>
							<header>
								<title>Genres</title>
							</header>
							{genres.map(capitalizeText).map(genre => {
								return <text key={genre}>{genre}</text>;
							})}
						</info>
						{actors.length && (
							<info>
								<header>
									<title>Actors</title>
								</header>
								{actors.map(({person_en}) => {
									return <text key={person_en}>{person_en}</text>;
								})}
							</info>
						)}
					</infoList>
				);
			},

			renderInfo() {
				let {title, description, likes} = this.state.tvshow;
				let hasTrailers = !!this.state.trailers.length;
				let buttons = <row />;

				let continueWatchingBtn = (
					<buttonLockup
						onPlay={this.onContinueWatchingAndPlay}
						onSelect={this.onContinueWatching}
					>
						<badge src="resource://button-play" />
						<title>Continue Watching</title>
					</buttonLockup>
				);

				let showTrailerBtn = (
					<buttonLockup onSelect={this.onShowTrailer}>
						<badge src="resource://button-preview" />
						<title>Show{'\n'}Trailer</title>
					</buttonLockup>
				);

				let startWatchingBtn = (
					<buttonLockup onSelect={this.onAddToSubscriptions}>
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

				let moreBtn = (
					<buttonLockup onSelect={this.onMore}>
						<badge src="resource://button-more" />
						<title>More</title>
					</buttonLockup>
				);

				if (this.state.watching) {
					buttons = (
						<row>
							{this.state.continueWatching && continueWatchingBtn}
							{hasTrailers && showTrailerBtn}
							{this.state.authorized && stopWatchingBtn}
							{this.state.authorized && moreBtn}
						</row>
					);
				} else {
					buttons = (
						<row>
							{hasTrailers && showTrailerBtn}
							{this.state.authorized && startWatchingBtn}
							{this.state.authorized && moreBtn}
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
							handlesOverflow="true"
							onSelect={this.onShowFullDescription}
						>{description}</description>
						{buttons}
					</stack>
				);
			},

			renderSeasons() {
				let {sid, title, covers} = this.state.tvshow;

				let scheduleDiff = this.state.schedule
					.slice(this.state.seasons.length)
					.map(season => assign({covers, begins: season.episodes[0].date}, season));

				let seasons = this.state.seasons.concat(scheduleDiff);

				let currentMoment = moment();
				let nextDay = currentMoment.clone().add(moment.relativeTimeThreshold('h'), 'hour');
				let nextMonth = currentMoment.clone().add(moment.relativeTimeThreshold('d'), 'day');

				if (!seasons.length) return null;

				return (
					<shelf>
						<header>
							<title>Seasons</title>
						</header>
						<section>
							{seasons.map((season, i) => {
								let {
									begins,
									season: seasonNumber,
									covers: {big: poster},
								} = season;

								let seasonTitle = `Season ${seasonNumber}`;
								let unwatched = calculateUnwatchedCount(season);
								let isWatched = !unwatched;

								let {episodes: seasonEpisodes} = season;
								let {episodes: scheduleEpisodes} = this.state.schedule[i] || {episodes: []};
								let scheduleDiff = scheduleEpisodes.slice(seasonEpisodes.length);
								let [scheduleEpisode] = scheduleDiff.filter(episode => {
									return moment(episode.date, 'DD.MM.YYYY') > currentMoment;
								});
								let dateTitle;
								let date;

								if (scheduleEpisode) {
									date = moment(scheduleEpisode.date, 'DD.MM.YYYY');

									if (!date.isValid() || nextMonth < date) {
										dateTitle = `Soon`;
									} else if (nextDay > date) {
										dateTitle = `New episode in a day`;
									} else {
										dateTitle = `New episode ${date.fromNow()}`;
									}
									currentMoment < date && (isWatched = false);
								}

								if (begins) {
									date = moment(begins, 'DD.MM.YYYY');

									if (!date.isValid() || nextMonth < date) {
										dateTitle = `Soon`;
									} else if (nextDay > date) {
										dateTitle = `New season in a day`;
									} else {
										dateTitle = `New season ${date.fromNow()}`;
									}
									isWatched = false;
								}

								return (
									<Tile
										key={seasonNumber}
										title={seasonTitle}
										route="season"
										poster={poster}
										counter={unwatched || dateTitle}
										isWatched={isWatched}
										payload={{sid, id: seasonNumber, title: `${title} — ${seasonTitle}`}}
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
				if (!this.state.tvshow.actors.length) return null;

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
									character_en,
								} = actor;

								let [firstName, lastName] = person_en.split(' ');

								return (
									<monogramLockup
										key={person_id}
										onSelect={link('actor', {id: person_id, actor: person_en})}
									>
										<monogram 
											style="tv-placeholder: monogram"
											src={person_image_original}
											firstName={firstName}
											lastName={lastName}
										/>
										<title>{person_en}</title>
										<subtitle style="tv-text-highlight-style: marquee-on-highlight">
											{character_en}
										</subtitle>
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
					network,
					episode_runtime,
					country: countryCode,
				} = this.state.tvshow;

				let {contries} = this.state;
				let [{full: country}] = contries.filter(({short}) => short === countryCode)

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
								<text>{moment.duration(+episode_runtime, 'minutes').humanize()}</text>
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

			onContinueWatchingAndPlay(event) {
				this.onContinueWatching(event, true);
			},

			onContinueWatching(event, shouldPlayImmediately) {
				let uncompletedSeason = this.getSeasonToWatch(this.state.seasons);
				let {season: seasonNumber} = uncompletedSeason;
				let seasonTitle = `Season ${seasonNumber}`;
				let {sid, title} = this.state.tvshow;

				TVDML.navigate('season', {
					sid,
					id: seasonNumber,
					title: `${title} — ${seasonTitle}`,
					shouldPlayImmediately,
				});
			},

			onShowTrailer() {
				let [trailer] = this.state.trailers;

				TVDML
					.createPlayer({
						items(item, request) {
							if (!item) return getTrailerItem(trailer);
							return null;
						},

						uidResolver(item) {
							return item.id;
						},
					})
					.then(player => player.play());
			},

			onAddToSubscriptions() {
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

			onShowFullReview({id, user, text, you_liked, you_disliked}) {
				TVDML
					.renderModal(
						<document>
							<descriptiveAlertTemplate>
								<title>{user}</title>
								<description>{processEntitiesInString(text)}</description>
								{!you_liked && !you_disliked && (
									<row>
										<button onSelect={this.onReviewLiked.bind(this, id)}>
											<text>👍</text>
										</button>
										<button onSelect={this.onReviewDisliked.bind(this, id)}>
											<text>👎</text>
										</button>
									</row>
								)}
							</descriptiveAlertTemplate>
						</document>
					)
					.sink();
			},

			onReviewLiked(id) {
				return markReviewAsLiked(id)
					.then(this.loadData.bind(this))
					.then(this.setState.bind(this))
					.then(TVDML.removeModal);
			},

			onReviewDisliked(id) {
				return markReviewAsDisliked(id)
					.then(this.loadData.bind(this))
					.then(this.setState.bind(this))
					.then(TVDML.removeModal);
			},

			onMore() {
				let hasWatchedEpisodes = this.state.seasons.some(({unwatched}) => !unwatched);
				let hasUnwatchedEpisodes = this.state.seasons.some(({unwatched}) => !!unwatched);

				TVDML
					.renderModal(
						<document>
							<alertTemplate>
								<title>More</title>
								{hasUnwatchedEpisodes && (
									<button onSelect={this.onMarkTVShowAsWatched}>
										<text>Mark TV Show as Watched</text>
									</button>
								)}
								{hasWatchedEpisodes && (
									<button onSelect={this.onMarkTVShowAsUnwatched}>
										<text>Mark TV Show as Unwatched</text>
									</button>
								)}
							</alertTemplate>
						</document>
					)
					.sink();
			},

			onMarkTVShowAsWatched() {
				let {sid} = this.props;

				return markTVShowAsWatched(sid)
					.then(this.loadData.bind(this))
					.then(this.setState.bind(this))
					.then(TVDML.removeModal);
			},

			onMarkTVShowAsUnwatched() {
				let {sid} = this.props;

				return markTVShowAsUnwatched(sid)
					.then(this.loadData.bind(this))
					.then(this.setState.bind(this))
					.then(TVDML.removeModal);
			},
		})));
}

function calculateUnwatchedCount(season) {
	return season.unwatched || 0;
}

function getTrailerItem(trailer) {
	let {tid} = getEpisodeMedia(trailer);

	return getTrailerStream(tid).then(({stream}) => ({
		id: tid,
		url: stream,
	}));
}
