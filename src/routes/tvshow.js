import moment from 'moment';
import * as TVDML from 'tvdml';
import formatNumber from 'simple-format-number';

import * as user from '../user';
import {processFamilyAccount} from '../user/utils';

import authFactory from '../helpers/auth';
import {defaultErrorHandlers} from '../helpers/auth/handlers';

import {get as i18n} from '../localization';
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
	markSeasonAsWatched,
	markSeasonAsUnwatched,
	markReviewAsLiked,
	markReviewAsDisliked,
	addToMyTVShows,
	removeFromMyTVShows,
	rateTVShow,
} from '../request/soap';

import Tile from '../components/tile';
import Loader from '../components/loader';
import Authorize from '../components/authorize';

const {Promise} = TVDML;

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.passthrough(({navigation: {sid, title, poster}}) => ({sid, title, poster})))
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				const extended = user.isExtended();
				const authorized = user.isAuthorized();

				return {
					likes: 0,
					extended,
					authorized,
					loading: true,
					watching: false,
					continueWatching: false,
				};
			},

			componentDidMount() {
				const {sid} = this.props;
				const currentDocument = this._rootNode.ownerDocument;

				this.menuButtonPressStream = TVDML.subscribe('menu-button-press');
				this.menuButtonPressStream
					.pipe(isMenuButtonPressNavigatedTo(currentDocument))
					.pipe(isNavigated => isNavigated && this.loadData().then(this.setState.bind(this)));

				this.userStateChangeStream = user.subscription();
				this.userStateChangeStream.pipe(() => this.setState({
					extended: user.isExtended(),
					authorized: user.isAuthorized(),
				}));

				this.appResumeStream = TVDML.subscribe(TVDML.event.RESUME);
				this.appResumeStream.pipe(() => this.loadData().then(this.setState.bind(this)));

				// To improuve UX on fast request we are adding rendering timeout.
				const waitForAnimations = new Promise((resolve) => setTimeout(resolve, 500));

				Promise
					.all([this.loadData(), waitForAnimations])
					.then(([payload]) => this.setState({loading: false, ...payload}));
			},

			componentWillUnmount() {
				this.menuButtonPressStream.unsubscribe();
				this.userStateChangeStream.unsubscribe();
				this.appResumeStream.unsubscribe();
			},

			shouldComponentUpdate: deepEqualShouldUpdate,

			loadData() {
				const {sid} = this.props;

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
					.then(payload => ({
						likes: +payload.tvshow.likes,
						watching: payload.tvshow.watching > 0,
						continueWatching: !!this.getSeasonToWatch(payload.seasons),
						...payload,
					}));
			},

			render() {
				if (this.state.loading) {
					return (
						<Loader
							title={this.props.title}
							heroImg={this.props.poster}
						/>
					);
				}

				return (
					<document>
						<productTemplate>
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
				const {
					status,
					genres,
					actors,
				} = this.state.tvshow;

				return (
					<infoList>
						<info>
							<header>
								<title>
									{i18n('tvshow-status')}
								</title>
							</header>
							<text>
								{i18n(TVShowStatusStrings[TVShowStatuses[status]])}
							</text>
						</info>
						<info>
							<header>
								<title>
									{i18n('tvshow-genres')}
								</title>
							</header>
							{genres.map(capitalizeText).map(genre => {
								return <text key={genre}>{genre}</text>;
							})}
						</info>
						{actors.length && (
							<info>
								<header>
									<title>
										{i18n('tvshow-actors')}
									</title>
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
				const {likes, extended} = this.state;
				const {description, soap_rating} = this.state.tvshow;
				const title = i18n('tvshow-title', this.state.tvshow);
				const hasTrailers = !!this.state.trailers.length;
				const hasMultipleTrailers = this.state.trailers.length > 1;

				let buttons = <row />;

				const continueWatchingBtn = (
					<buttonLockup
						onPlay={this.onContinueWatchingAndPlay}
						onSelect={this.onContinueWatching}
					>
						<badge src="resource://button-play" />
						<title>
							{i18n('tvshow-control-continue-watching')}
						</title>
					</buttonLockup>
				);

				const showTrailerBtn = (
					<buttonLockup
						onPlay={this.onShowFirstTrailer}
						onSelect={this.onShowTrailer}
					>
						<badge src="resource://button-preview" />
						<title>
							{i18n(hasMultipleTrailers ? 'tvshow-control-show-trailers' : 'tvshow-control-show-trailer')}
						</title>
					</buttonLockup>
				);

				const startWatchingBtn = (
					<buttonLockup onSelect={this.onAddToSubscriptions}>
						<badge src="resource://button-add" />
						<title>
							{i18n('tvshow-control-start-watching')}
						</title>
					</buttonLockup>
				);

				const stopWatchingBtn = (
					<buttonLockup onSelect={this.onRemoveFromSubscription}>
						<badge src="resource://button-remove" />
						<title>
							{i18n('tvshow-control-stop-watching')}
						</title>
					</buttonLockup>
				);

				const moreBtn = (
					<buttonLockup onSelect={this.onMore}>
						<badge src="resource://button-more" />
						<title>
							{i18n('tvshow-control-more')}
						</title>
					</buttonLockup>
				);

				const rateBtn = (
					<buttonLockup onSelect={this.onRate}>
						<badge src="resource://button-rate" />
						<title>
							{i18n('tvshow-control-rate')}
						</title>
					</buttonLockup>
				);

				if (this.state.watching) {
					buttons = (
						<row>
							{this.state.continueWatching && extended && continueWatchingBtn}
							{hasTrailers && showTrailerBtn}
							{this.state.authorized && stopWatchingBtn}
							{this.state.authorized && rateBtn}
							{this.state.authorized && moreBtn}
						</row>
					);
				} else {
					buttons = (
						<row>
							{hasTrailers && showTrailerBtn}
							{startWatchingBtn}
							{this.state.authorized && rateBtn}
							{this.state.authorized && moreBtn}
						</row>
					);
				}

				return (
					<stack>
						<title>{title}</title>
						<row>
							<ratingBadge value={soap_rating / 10} />
							<text>
								{i18n('tvshow-liked-by')}
								{' '}
								{likes > 0 ? i18n('tvshow-liked-by-people', {likes}) : i18n('tvshow-liked-by-no-one')}
							</text>
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
				let {sid, covers} = this.state.tvshow;
				let title = i18n('tvshow-title', this.state.tvshow);

				let scheduleDiff = this.state.schedule
					.slice(this.state.seasons.length)
					.map(season => ({
						covers, 
						begins: season.episodes[0].date,
						...season,
					}));

				let seasons = this.state.seasons.concat(scheduleDiff);

				let currentMoment = moment();
				let nextDay = currentMoment.clone().add(moment.relativeTimeThreshold('h'), 'hour');
				let nextMonth = currentMoment.clone().add(moment.relativeTimeThreshold('d'), 'day');

				if (!seasons.length) return null;

				return (
					<shelf>
						<header>
							<title>
								{i18n('tvshow-seasons')}
							</title>
						</header>
						<section>
							{seasons.map((season, i) => {
								let {
									begins,
									season: seasonNumber,
									covers: {big: poster},
								} = season;

								let seasonTitle = i18n('tvshow-season', {seasonNumber});
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
										dateTitle = i18n('new-episode-soon');
									} else if (nextDay > date) {
										dateTitle = i18n('new-episode-day');
									} else {
										dateTitle = i18n('new-episode-custom-date', {date: date.fromNow()});
									}
									currentMoment < date && (isWatched = false);
								}

								if (begins) {
									date = moment(begins, 'DD.MM.YYYY');

									if (!date.isValid() || nextMonth < date) {
										dateTitle = i18n('new-season-soon');
									} else if (nextDay > date) {
										dateTitle = i18n('new-season-day');
									} else {
										dateTitle = i18n('new-season-custom-date', {date: date.fromNow()});
									}
									isWatched = false;
								}

								const payload = {
									sid,
									poster,
									id: seasonNumber,
									title: `${title} — ${seasonTitle}`,
								};

								return (
									<Tile
										key={seasonNumber}
										title={seasonTitle}
										route="season"
										poster={poster}
										counter={unwatched || dateTitle}
										isWatched={isWatched}
										payload={payload}
										onHoldselect={this.onSeasonOptions.bind(this, payload.id, payload.title, isWatched)}
									/>
								);
							})}
						</section>
					</shelf>
				);
			},

			onSeasonOptions(id, title, isWatched) {
				TVDML
					.renderModal(
						<document>
							<alertTemplate>
								<title>
									{title}
								</title>
								{isWatched ? (
									<button onSelect={this.onMarkSeasonAsUnwatched.bind(this, id)}>
										<text>
											{i18n('season-mark-as-unwatched')}
										</text>
									</button>
								) : (
									<button onSelect={this.onMarkSeasonAsWatched.bind(this, id)}>
										<text>
											{i18n('season-mark-as-watched')}
										</text>
									</button>
								)}
							</alertTemplate>
						</document>
					)
					.sink();
			},

			onMarkSeasonAsWatched(id) {
				const {sid} = this.state.tvshow;

				return markSeasonAsWatched(sid, id)
					.then(this.loadData.bind(this))
					.then(this.setState.bind(this))
					.then(TVDML.removeModal);
			},

			onMarkSeasonAsUnwatched(id) {
				const {sid} = this.state.tvshow;

				return markSeasonAsUnwatched(sid, id)
					.then(this.loadData.bind(this))
					.then(this.setState.bind(this))
					.then(TVDML.removeModal);
			},

			renderRecomendations() {
				if (!this.state.recomendations.length) return null;

				return (
					<shelf>
						<header>
							<title>
								{i18n('tvshow-also-watched')}
							</title>
						</header>
						<section>
							{this.state.recomendations.map(tvshow => {
								let {
									sid,
									covers: {big: poster}
								} = tvshow;

								let title = i18n('tvshow-title', tvshow);

								return (
									<Tile
										key={sid}
										title={title}
										poster={poster}
										route="tvshow"
										payload={{sid, title, poster}}
									/>
								);
							})}
						</section>
					</shelf>
				);
			},

			renderRatings() {
				const {
					soap_votes,
					soap_rating,
					imdb_votes,
					imdb_rating,
					kinopoisk_votes,
					kinopoisk_rating,
				} = this.state.tvshow;

				return (
					<shelf>
						<header>
							<title>
								{i18n('tvshow-ratings')}
							</title>
						</header>
						<section>
							{!!+imdb_rating && (
								<ratingCard>
									<title>{(`${imdb_rating}`).slice(0, 3)} / 10</title>
									<ratingBadge value={imdb_rating / 10} />
									<description>
										{i18n('tvshow-average-imdb', {amount: formatNumber(+imdb_votes, {fractionDigits: 0})})}
									</description>
								</ratingCard>
							)}
							{!!+kinopoisk_rating && (
								<ratingCard>
									<title>{(`${kinopoisk_rating}`).slice(0, 3)} / 10</title>
									<ratingBadge value={kinopoisk_rating / 10} />
									<description>
										{i18n('tvshow-average-kinopoisk', {amount: formatNumber(+kinopoisk_votes, {fractionDigits: 0})})}
									</description>
								</ratingCard>
							)}
							{!!+soap_rating && (
								<ratingCard>
									<title>{(`${soap_rating}`).slice(0, 3)} / 10</title>
									<ratingBadge value={soap_rating / 10} />
									<description>
										{i18n('tvshow-average-soap', {amount: formatNumber(+soap_votes, {fractionDigits: 0})})}
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
							<title>
								{i18n('tvshow-cast-crew')}
							</title>
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
										onSelect={link('actor', {id: person_id, actor: person_en, poster: person_image_original})}
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
								<title>
									{i18n('tvshow-information')}
								</title>
							</header>
							<info>
								<header>
									<title>
										{i18n('tvshow-information-year')}
									</title>
								</header>
								<text>{year}</text>
							</info>
							<info>
								<header>
									<title>
										{i18n('tvshow-information-runtime')}
									</title>
								</header>
								<text>{moment.duration(+episode_runtime, 'minutes').humanize()}</text>
							</info>
							<info>
								<header>
									<title>
										{i18n('tvshow-information-country')}
									</title>
								</header>
								<text>{country}</text>
							</info>
							<info>
								<header>
									<title>
										{i18n('tvshow-information-network')}
									</title>
								</header>
								<text>{network}</text>
							</info>
						</infoTable>
						<infoTable>
							<header>
								<title>
									{i18n('tvshow-languages')}
								</title>
							</header>
							<info>
								<header>
									<title>
										{i18n('tvshow-languages-primary')}
									</title>
								</header>
								<text>
									{i18n('tvshow-languages-primary-values')}
								</text>
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
				const uncompletedSeason = this.getSeasonToWatch(this.state.seasons);
				const {season: seasonNumber, covers: {big: poster}} = uncompletedSeason;
				const seasonTitle = i18n('tvshow-season', {seasonNumber});
				const title = i18n('tvshow-title', this.state.tvshow);
				const {sid} = this.state.tvshow;

				TVDML.navigate('season', {
					sid,
					poster,
					id: seasonNumber,
					title: `${title} — ${seasonTitle}`,
					shouldPlayImmediately,
				});
			},

			onShowTrailer() {
				const {trailers} = this.state;

				if (trailers.length < 2) {
					return this.onShowFirstTrailer();
				}

				const title = i18n('tvshow-title', this.state.tvshow);

				TVDML
					.renderModal(
						<document>
							<alertTemplate>
								<title>
									{title}
								</title>
								{trailers.map(trailer => (
									<button onSelect={this.playTrailer.bind(this, trailer)}>
										<text>{trailer.name}</text>
									</button>
								))}
							</alertTemplate>
						</document>
					)
					.sink();
			},

			onShowFirstTrailer() {
				const [trailer] = this.state.trailers;
				this.playTrailer(trailer);
			},

			playTrailer(trailer) {
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
				const {
					authorized,
					tvshow: {sid},
				} = this.state;

				if (!authorized) {
					const authHelper = authFactory({
						onError: defaultErrorHandlers,
						onSuccess: ({token, till, login}) => {
							user.set({token, till, logged: 1});
							processFamilyAccount(login)
								.then(this.loadData.bind(this))
								.then(payload => {
									this.setState(payload);
									authHelper.dismiss();
									this.onAddToSubscriptions();
								});
						},
					});

					return TVDML
						.renderModal(
							<Authorize
								description={i18n('authorize-tvshow-description')}
								onAuthorize={() => authHelper.present()}
							/>
						)
						.sink();
				}

				this.setState({
					watching: true,
					likes: this.state.likes + 1,
				});

				return addToMyTVShows(sid);
			},

			onRemoveFromSubscription() {
				const {sid} = this.state.tvshow;

				this.setState({
					watching: false,
					likes: this.state.likes - 1,
				});

				return removeFromMyTVShows(sid);
			},

			onShowFullDescription() {
				const title = i18n('tvshow-title', this.state.tvshow);
				const {description} = this.state.tvshow;

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

			onRate() {
				const {title} = this.props;

				TVDML
					.renderModal(
						<document>
							<ratingTemplate>
								<title>{title}</title>
								<ratingBadge onChange={this.onRateChange} />
							</ratingTemplate>
						</document>
					)
					.sink();
			},

			onRateChange(event) {
				return this.onRateTVShow(event.value * 10);
			},

			onRateTVShow(rating) {
				const {sid} = this.props;

				return rateTVShow(sid, rating)
					.then(({votes: soap_votes, rating: soap_rating}) => ({soap_votes, soap_rating}))
					.then(rating => this.setState({
						tvshow: {
							...this.state.tvshow,
							...rating,
						},
					}))
					.then(TVDML.removeModal);
			},

			onMore() {
				const hasWatchedEpisodes = this.state.seasons.some(({unwatched}) => !unwatched);
				const hasUnwatchedEpisodes = this.state.seasons.some(({unwatched}) => !!unwatched);

				TVDML
					.renderModal(
						<document>
							<alertTemplate>
								<title>
									{i18n('tvshow-title-more')}
								</title>
								{hasUnwatchedEpisodes && (
									<button onSelect={this.onMarkTVShowAsWatched}>
										<text>
											{i18n('tvshow-mark-as-watched')}
										</text>
									</button>
								)}
								{hasWatchedEpisodes && (
									<button onSelect={this.onMarkTVShowAsUnwatched}>
										<text>
											{i18n('tvshow-mark-as-unwatched')}
										</text>
									</button>
								)}
							</alertTemplate>
						</document>
					)
					.sink();
			},

			onMarkTVShowAsWatched() {
				const {sid} = this.props;

				return markTVShowAsWatched(sid)
					.then(this.loadData.bind(this))
					.then(this.setState.bind(this))
					.then(TVDML.removeModal);
			},

			onMarkTVShowAsUnwatched() {
				const {sid} = this.props;

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
