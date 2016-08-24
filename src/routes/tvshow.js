/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';
import assign from 'object-assign';
import formatNumber from 'simple-format-number';

import {getDefault} from '../quality';
import {parseTVShowPage} from '../info';
import {getActor, getActorPhoto} from '../info/tmdb';
import {deepEqualShouldUpdate} from '../utils/components';

import {
	link,
	capitalizeText,
	isMenuButtonPressNavigatedTo,
} from '../utils';

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
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				return {
					loading: true,
					watching: false,
					continueWatching: false,
					poster: `http://covers.soap4.me/soap/big/${this.props.sid}.jpg`,
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
						getTVShow(sid),
						getTVShowSeasons(sid),
					])
					.then(([tvshow, seasons]) => ({tvshow, seasons}))
					.then(({tvshow, seasons}) => {
						return parseTVShowPage(tvshow).then(extra => ({tvshow, seasons, extra}));
					})
					.then(({tvshow, seasons, extra}) => {
						let {actors} = extra;

						return Promise
							.all(actors.map(getActor))
							.then(actorsProfiles => actorsProfiles.reduce((result, actor, i) => {
								if (actor) result[actors[i]] = getActorPhoto(actor);
								return result;
							}, {}))
							.then(actorsPhotos => ({actorsPhotos, tvshow, seasons, extra}));
					})
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
				let {status, genres, actors} = this.state.extra;

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
								return <text key={genre}>{genre}</text>;
							})}
						</info>
						<info>
							<header>
								<title>Actors</title>
							</header>
							{actors.map(actor => {
								return <text key={actor}>{actor}</text>;
							})}
						</info>
					</infoList>
				);
			},

			renderInfo() {
				let {title, description} = this.state.tvshow;
				let {count} = this.state.extra;
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
							<text>Watched by {count > 0 ? `${count} people` : `no one`}</text>
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
								let {id} = season;
								let seasonTitle = `Season ${season.season}`;
								let poster = `http://covers.soap4.me/season/big/${id}.jpg`;
								let unwatched = calculateUnwatchedCount(season);

								return (
									<Tile
										key={id}
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
				let {recomendations} = this.state.extra;

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

				let {reviews} = this.state.extra;

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
									<reviewCard
										key={`${user}-${date}`}
										onSelect={this.onShowFullReview.bind(this, review)}
									>
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
				let {actors} = this.state.extra;

				return (
					<shelf>
						<header>
							<title>Cast and Crew</title>
						</header>
						<section>
							{actors.map(name => {
								let [firstName, lastName] = name.split(' ');

								return (
									<monogramLockup
										key={name}
										onSelect={link('actor', {actor: name})}
									>
										<monogram 
											src={this.state.actorsPhotos[name]}
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
				let {year} = this.state.tvshow;
				let {duration, country, runtime} = this.state.extra;

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

			getSeasonToWatch(seasons = []) {
				return seasons.reduce((result, season) => {
					if (!result && calculateUnwatchedCount(season)) return season;
					return result;
				}, null);
			},

			onContinueWatching() {
				let uncompletedSeason = this.getSeasonToWatch(this.state.seasons);
				let {sid, title} = this.state.tvshow;
				let {id, season} = uncompletedSeason;

				TVDML.navigate('season', {sid, id, title: `${title} — Season ${season}`});
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
								<description>{text}</description>
							</descriptiveAlertTemplate>
						</document>
					)
					.sink();
			},
		})));
}

function calculateUnwatchedCount({episodes}) {
	return episodes.reduce((result, episode) => result + +!getDefault(episode).watched, 0);
}
