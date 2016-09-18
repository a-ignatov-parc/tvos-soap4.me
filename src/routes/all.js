/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
import assign from 'object-assign';

import {getAllTVShows} from '../request/soap';
import {isMenuButtonPressNavigatedTo} from '../utils';
import {deepEqualShouldUpdate} from '../utils/components';

import Tile from '../components/tile';
import Loader from '../components/loader';

export default function(title) {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				return {
					title,
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
				return getAllTVShows().then(series => ({series}));
			},

			render() {
				if (this.state.loading) {
					return <Loader />;
				}

				return (
					<document>
						<stackTemplate>
							<banner>
								<title>{this.state.title}</title>
							</banner>
							<collectionList>
								<grid>
									<section>
										{this.state.series.map(({title, sid, unwatched, watching}) => {
											let poster = `http://covers.soap4.me/soap/big/${sid}.jpg`;

											return (
												<Tile
													key={sid}
													title={title}
													route="tvshow"
													poster={poster}
													counter={unwatched}
													isWatched={watching > 0 && !unwatched}
													payload={{title, sid}}
												/>
											);
										})}
									</section>
								</grid>
							</collectionList>
						</stackTemplate>
					</document>
				);
			},
		})));
}
