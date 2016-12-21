/** @jsx TVDML.jsx */

import moment from 'moment';
import * as TVDML from 'tvdml';
import assign from 'object-assign';

import * as user from '../user';
import authFactory from '../helpers/auth';
import {get as i18n} from '../localization';
import {defaultErrorHandlers} from '../helpers/auth/handlers';

import {
	getMyTVShows,
	getMySchedule,
	getFamilyAccounts,
} from '../request/soap';

import {link, isMenuButtonPressNavigatedTo} from '../utils';
import {deepEqualShouldUpdate} from '../utils/components';

import Tile from '../components/tile';
import Loader from '../components/loader';
import Authorize from '../components/authorize';

import commonStyles from '../common/styles';

const {Promise} = TVDML;

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				let authorized = user.isAuthorized();

				return {
					authorized,
					loading: !!authorized,
				};
			},

			componentDidMount() {
				let currentDocument = this._rootNode.ownerDocument;

				this.menuButtonPressStream = TVDML.subscribe('menu-button-press');
				this.menuButtonPressStream
					.pipe(isMenuButtonPressNavigatedTo(currentDocument))
					.pipe(isNavigated => isNavigated && this.loadData().then(this.setState.bind(this)));

				this.userStateChangeStream = user.subscription();
				this.userStateChangeStream.pipe(() => {
					this.setState({loading: true});
					this.loadData().then(payload => {
						this.setState(assign({
							loading: false,
							authorized: user.isAuthorized(),
						}, payload));
					});
				});

				this.authHelper = authFactory({
					onError: defaultErrorHandlers,
					onSuccess({token, till}) {
						user.set({token, till, logged: 1});
						getFamilyAccounts().then(({family, selected}) => {
							user.set({family, selected});
							this.dismiss();
						});
					},
				});

				this.loadData().then(payload => {
					this.setState(assign({loading: false}, payload));
				});
			},

			componentWillUnmount() {
				this.menuButtonPressStream.unsubscribe();
				this.userStateChangeStream.unsubscribe();
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

				if (!this.state.series.length) {
					return (
						<document>
							<head>
								{commonStyles}
							</head>
							<alertTemplate>
								<title class="grey_text">
									{i18n('my-empty-list-title')}
								</title>
								<description class="grey_description">
									{i18n('my-empty-list-description')}
								</description>
								<button onSelect={link('all')}>
									<text>
										{i18n('my-empty-list-button')}
									</text>
								</button>
							</alertTemplate>
						</document>
					);
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
									{i18n('my-caption')}
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
								{i18n(title)}
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

								let title = i18n('tvshow-title', tvshow);
								let scheduleEpisode = scheduleDictionary[sid];
								let isWatched = !unwatched;
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
