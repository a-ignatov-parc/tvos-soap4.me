/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';
import assign from 'object-assign';

import * as user from '../user';
import authFactory from '../helpers/auth';
import {defaultErrorHandlers} from '../helpers/auth/handlers';

import {getMyTVShows} from '../request/soap';
import {isMenuButtonPressNavigatedTo} from '../utils';
import {deepEqualShouldUpdate} from '../utils/components';

import Tile from '../components/tile';
import Loader from '../components/loader';

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
				return getMyTVShows().then(series => ({series}));
			},

			render() {
				if (this.state.loading) {
					return <Loader />;
				}

				if (!this.state.authorized) {
					return (
						<document>
							<head>
								<style content={`
									.grey_text {
										color: rgb(84, 82, 80);
									}

									.grey_description {
										color: rgb(132, 133, 135);
									}

									.black_text {
										color: rgb(0, 0, 0);
									}
								`} />
							</head>
							<alertTemplate>
								<title class="grey_text">
									Authorization
								</title>
								<description class="grey_description">
									You need to be authorized in order to see your subscriptions
								</description>
								<button onSelect={this.onLogin}>
									<text class="black_text">Authorize</text>
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
								<title>{this.state.title}</title>
							</banner>
							<collectionList>
								{this.renderSectionGrid(unwatched, 'New episodes')}
								{this.renderSectionGrid(watched, 'Watched')}
								{this.renderSectionGrid(closed, 'Closed')}
							</collectionList>
						</stackTemplate>
					</document>
				);
			},

			renderSectionGrid(collection, title) {
				let header;

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
							{collection.map(({title, sid, unwatched}) => {
								let poster = `http://covers.soap4.me/soap/big/${sid}.jpg`;

								return (
									<Tile
										key={sid}
										title={title}
										route="tvshow"
										poster={poster}
										payload={{title, sid}}
										subtitle={!!unwatched && `${unwatched} ${plur('episode', unwatched)}`}
									/>
								);
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
