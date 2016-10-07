/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
import assign from 'object-assign';

import {getAllTVShows} from '../request/soap';
import {isMenuButtonPressNavigatedTo} from '../utils';
import {deepEqualShouldUpdate} from '../utils/components';

import Tile from '../components/tile';
import Loader from '../components/loader';

const NAME = 'name';
const DATE = 'date';
const LIKES = 'likes';
const RATING = 'rating';
const COMPLETENESS = 'completeness';

const sections = {
	[NAME]: {
		title: 'Name',
		reducer(list) {
			return [{
				title: 'A — Z',
				items: list,
			}];
		},
	},

	[DATE]: {
		title: 'Date',
		reducer(list) {
			let collection = list
				.slice(0)
				.sort(({sid: a}, {sid: b}) => b - a)
				.reduce((result, item) => {
					if (!result[item.year]) result[item.year] = [];
					result[item.year].push(item);
					return result;
				}, {});

			return Object
				.keys(collection)
				.sort((a, b) => b - a)
				.map(year => ({
					title: year,
					items: collection[year],
				}));
		},
	},

	[LIKES]: {
		title: 'Likes',
		reducer(list) {
			let likesCollection = list
				.slice(0)
				.sort(({likes: a}, {likes: b}) => b - a)
				.reduce((result, item) => {
					let thousand = ~~(item.likes / 1000);
					let hundred = ~~(item.likes / 100);
					let key = thousand ? thousand * 10 : hundred;

					if (!result[key]) result[key] = {thousand, hundred, likes: [], items: []};
					result[key].likes.push(item.likes);
					result[key].items.push(item);
					return result;
				}, {});

			return Object
				.keys(likesCollection)
				.sort((a, b) => b - a)
				.map(key => {
					let {thousand, hundred, likes, items} = likesCollection[key];
					let title = `Over ${thousand}k`;

					if (!thousand) {
						title = hundred ? `Over ${hundred * 100}` : `Lower ${(hundred + 1) * 100}`;
					}
					return {title, items};
				});
		},
	},

	[RATING]: {
		title: 'Rating',
		reducer(list) {
			let collection = list.reduce((result, item) => {
				if (!result[item.imdb_rating]) result[item.imdb_rating] = [];
				result[item.imdb_rating].push(item);
				return result;
			}, {});

			return Object
				.keys(collection)
				.sort((a, b) => b - a)
				.map(rating => ({
					title: rating,
					items: collection[rating],
				}));
		},
	},

	[COMPLETENESS]: {
		title: 'Completeness',
		reducer(list) {
			return [{
				title: 'Completed',
				items: list.filter(({status}) => +status),
			}];
		},
	},
};

export default function(title) {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				return {
					title,
					loading: true,
					groupId: NAME,
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

				let {title, reducer} = sections[this.state.groupId];
				let groups = reducer(this.state.series);

				return (
					<document>
						<stackTemplate>
							<banner>
								<title>{this.state.title}</title>
							</banner>
							<collectionList>
								<separator>
									<button onSelect={this.onSwitchGroup}>
										<text>
											Group by {title}
											{' '}
											<badge
												width="31"
												height="14"
												src="resource://button-dropdown"
												style="tv-tint-color: rgb(0, 0, 0); margin: 0 0 5 0"
											/>
										</text>
									</button>
								</separator>
								{groups.map(({title, items}) => (
									<grid key={title}>
										<header>
											<title>{title}</title>
										</header>
										<section>
											{items.map(({
												sid,
												title,
												watching,
												unwatched,
												covers: {big: poster},
											}) => (
												<Tile
													key={sid}
													title={title}
													route="tvshow"
													poster={poster}
													counter={unwatched}
													isWatched={watching > 0 && !unwatched}
													payload={{title, sid}}
												/>
											))}
										</section>
									</grid>
								))}
							</collectionList>
						</stackTemplate>
					</document>
				);
			},

			onSwitchGroup() {
				let sectionsList = Object
					.keys(sections)
					.map(id => ({id, title: sections[id].title}));

				TVDML
					.renderModal(
						<document>
							<alertTemplate>
								<title>Group by</title>
								{sectionsList.map(({id, title}) => (
									<button
										key={id}
										onSelect={this.onGroupSelect.bind(this, id)}
										autoHighlight={id === this.state.groupId || undefined}
									>
										<text>{title}</text>
									</button>
								))}
							</alertTemplate>
						</document>
					)
					.sink();
			},

			onGroupSelect(groupId) {
				this.setState({groupId});
				TVDML.removeModal();
			},
		})));
}
