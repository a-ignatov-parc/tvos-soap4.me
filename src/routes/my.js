/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';
import assign from 'object-assign';

import {getMyTVShows} from '../request/soap';

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
					.pipe(({to: {document}}) => {
						console.log(document, currentDocument);
						// if (currentDocument === document) {
						// 	this.loadData().then(this.setState.bind(this));
						// }
					});

				this.loadData().then(payload => {
					this.setState(assign({loading: false}, payload));
				});
			},

			componentWillUnmount() {
				this.menuButtonPressPipeline.unsubscribe();
			},

			shouldComponentUpdate(nextProps, nextState) {
				let propsAreEqual = JSON.stringify(this.props) === JSON.stringify(nextProps);
				let stateAreEqual = JSON.stringify(this.state) === JSON.stringify(nextState);

				return !propsAreEqual || !stateAreEqual;
			},

			loadData() {
				return getMyTVShows().then(series => ({series}));
			},

			render() {
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
