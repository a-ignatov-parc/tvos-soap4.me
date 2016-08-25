/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';
import assign from 'object-assign';

import {isAuthorized} from '../user';
import {getMyTVShows} from '../request/soap';
import {isMenuButtonPressNavigatedTo} from '../utils';
import {deepEqualShouldUpdate} from '../utils/components';

import Tile from '../components/tile';
import Loader from '../components/loader';

export default function(title) {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				let authorized = isAuthorized();

				return {
					title,
					authorized,
					loading: true,
				};
			},

			componentDidMount() {
				let currentDocument = this._rootNode.ownerDocument;

				this.menuButtonPressPipeline = TVDML
					.subscribe('menu-button-press')
					.pipe(isMenuButtonPressNavigatedTo(currentDocument))
					.pipe(isNavigated => isNavigated && this.loadData().then(this.setState.bind(this)));

				this.loadData().then(payload => {
					this.setState(assign({loading: false}, payload));
				});
			},

			componentWillUnmount() {
				this.menuButtonPressPipeline.unsubscribe();
			},

			shouldComponentUpdate: deepEqualShouldUpdate,

			loadData() {
				return getMyTVShows().then(series => ({series}));
			},

			render() {
				if (!this.state.authorized) {
					return (
						<document>
							<alertTemplate>
								<title>Authorization</title>
								<description>You need to be authorized in order to see your subscriptions</description>
								<button>
									<text>Authorize</text>
								</button>
							</alertTemplate>
						</document>
					);
				}

				if (this.state.loading) {
					return <Loader />;
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
		})));
}
