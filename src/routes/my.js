/** @jsx TVDML.jsx */

import moment from 'moment';
import * as TVDML from 'tvdml';
import assign from 'object-assign';

import * as user from '../user';
import authFactory from '../helpers/auth';
import * as localization from '../localization';
import {defaultErrorHandlers} from '../helpers/auth/handlers';

import {getMyTVShows, getMySchedule} from '../request/soap';
import {isMenuButtonPressNavigatedTo} from '../utils';
import {deepEqualShouldUpdate} from '../utils/components';

import Tile from '../components/tile';
import Loader from '../components/loader';
import Authorize from '../components/authorize';

const {Promise} = TVDML;

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				let authorized = user.isAuthorized();
				let language = localization.getLanguage();

				return {
					language,
					authorized,
					loading: !!authorized,
				};
			},

			componentDidMount() {
				let currentDocument = this._rootNode.ownerDocument;

				this.menuButtonPressPipeline = TVDML
					.subscribe('menu-button-press')
					.pipe(isMenuButtonPressNavigatedTo(currentDocument))
					.pipe(isNavigated => isNavigated && this.loadData().then(this.setState.bind(this)));

				this.userStateChangePipeline = user
					.subscription()
					.pipe(() => {
						this.setState({loading: true});
						this.loadData().then(payload => {
							this.setState(assign({
								loading: false,
								authorized: user.isAuthorized(),
							}, payload));
						});
					});

				this.languageChangePipeline = localization
					.subscription()
					.pipe(({language}) => this.setState({language}));

				this.authHelper = authFactory({
					onError: defaultErrorHandlers,
					onSuccess({token, till}, login) {
						user.set({token, till, login, logged: 1});
						this.dismiss();
					},
				});

				this.loadData().then(payload => {
					this.setState(assign({loading: false}, payload));
				});
			},

			componentWillUnmount() {
				this.menuButtonPressPipeline.unsubscribe();
				this.userStateChangePipeline.unsubscribe();
				this.languageChangePipeline.unsubscribe();
				this.authHelper.destroy();
				this.authHelper = null;
			},

			shouldComponentUpdate: deepEqualShouldUpdate,

			loadData() {
				if (!user.isAuthorized()) {
					return Promise.resolve({});
				}
				return Promise
					.all([
						getMyTVShows(),
						getMySchedule(),
					])
					.then(([series, schedule]) => ({series, schedule}));
			},

			render() {
				if (this.state.loading) {
					return <Loader />;
				}

				if (!this.state.authorized) {
					return <Authorize theme="dark" onAuthorize={this.onLogin} />;
				}

				let watching = this.state.series.filter(({watching}) => watching > 0);
				let others = this.state.series.filter(({watching}) => watching < 1);

				let ongoing = watching.filter(({status, unwatched}) => status == 0 || unwatched > 0);
				let unwatched = ongoing.filter(({unwatched}) => unwatched > 0);
				let watched = ongoing.filter(({unwatched}) => !unwatched);
				let closed = watching.filter(({status, unwatched}) => status > 0 && !unwatched);

				return (
					<document>
						<stackTemplate>
							<banner>
								<title>
									{localization.get('my-caption')}
								</title>
							</banner>
							<collectionList>
								{this.renderSectionGrid(unwatched, 'my-new-episodes')}
								{this.renderSectionGrid(watched, 'my-watched', this.state.schedule)}
								{this.renderSectionGrid(closed, 'my-closed')}
							</collectionList>
						</stackTemplate>
					</document>
				);
			},

			renderSectionGrid(collection, title, schedule = []) {
				let header;
				let scheduleDictionary = schedule.reduce((result, item) => {
					result[item.sid] = item;
					return result;
				}, {});

				if (title) {
					header = (
						<header>
							<title>
								{localization.get(title)}
							</title>
						</header>
					)
				}

				let currentMoment = moment();
				let nextDay = currentMoment.clone().add(moment.relativeTimeThreshold('h'), 'hour');
				let nextMonth = currentMoment.clone().add(moment.relativeTimeThreshold('d'), 'day');

				return (
					<grid>
						{header}
						<section>
							{collection.map(tvshow => {
								let {
									sid,
									unwatched,
									covers: {big: poster},
								} = tvshow;

								let title = localization.get('my-tvshow-title', tvshow);
								let scheduleEpisode = scheduleDictionary[sid];
								let isWatched = !unwatched;
								let dateTitle;
								let date;

								if (scheduleEpisode) {
									date = moment(scheduleEpisode.date, 'DD.MM.YYYY');

									if (!date.isValid() || nextMonth < date) {
										dateTitle = localization.get('my-new-episode-soon');
									} else if (nextDay > date) {
										dateTitle = localization.get('my-new-episode-day');
									} else {
										dateTitle = localization.get('my-new-episode-custom-date', {date: date.fromNow()});
									}
									currentMoment < date && (isWatched = false);
								}

								return (
									<Tile
										key={sid}
										title={title}
										route="tvshow"
										poster={poster}
										counter={unwatched || dateTitle}
										isWatched={isWatched}
										payload={{title, sid}}
									/>
								)
							})}
						</section>
					</grid>
				);
			},

			onLogin() {
				this.authHelper.present();
			},
		})));
}
