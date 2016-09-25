/** @jsx TVDML.jsx */

import moment from 'moment';
import * as TVDML from 'tvdml';
import assign from 'object-assign';

import * as user from '../user';
import authFactory from '../helpers/auth';
import {defaultErrorHandlers} from '../helpers/auth/handlers';

import {getMyTVShows, getMySchedule} from '../request/soap';
import {isMenuButtonPressNavigatedTo} from '../utils';
import {deepEqualShouldUpdate} from '../utils/components';

import Tile from '../components/tile';
import Loader from '../components/loader';
import Authorize from '../components/authorize';

const {Promise} = TVDML;

export default function(title) {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				let authorized = user.isAuthorized();

				return {
					title,
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
								<title>{this.state.title}</title>
							</banner>
							<collectionList>
								{this.renderSectionGrid(unwatched, 'New episodes')}
								{this.renderSectionGrid(watched, 'Watched', this.state.schedule)}
								{this.renderSectionGrid(closed, 'Closed')}
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
							<title>{title}</title>
						</header>
					)
				}

				return (
					<grid>
						{header}
						<section>
							{collection.map(({
								sid,
								title,
								unwatched,
								covers: {big: poster},
							}) => {
								let scheduleEpisode = scheduleDictionary[sid];
								let isWatched = !unwatched;
								let dateTitle;
								let date;

								if (scheduleEpisode) {
									date = moment(scheduleEpisode.date, 'DD.MM.YYYY');
									dateTitle = `Continues ${date.fromNow()}`;
									isWatched = false;
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
