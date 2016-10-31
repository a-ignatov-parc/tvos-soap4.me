/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
import assign from 'object-assign';

import {get as i18n} from '../localization';

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
		title: 'all-group-title-name',
		reducer(list) {
			return [{
				title: i18n('all-group-name-title'),
				items: list,
			}];
		},
	},

	[DATE]: {
		title: 'all-group-title-date',
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
		title: 'all-group-title-likes',
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
					let title = i18n('all-group-likes-title-over-thousand', {thousand});

					if (!thousand) {
						if (hundred) {
							title = i18n('all-group-likes-title-over-hundred', {hundred: hundred * 100});
						} else {
							title = i18n('all-group-likes-title-lower-hundred', {hundred: (hundred + 1) * 100});
						}
					}
					return {title, items};
				});
		},
	},

	[RATING]: {
		title: 'all-group-title-rating',
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
		title: 'all-group-title-completeness',
		reducer(list) {
			return [{
				title: i18n('all-group-completeness-title'),
				items: list.filter(({status}) => +status),
			}];
		},
	},
};

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				return {
					loading: true,
					groupId: NAME,
				};
			},

			componentDidMount() {
				let currentDocument = this._rootNode.ownerDocument;

				this.menuButtonPressStream = TVDML.subscribe('menu-button-press');
				this.menuButtonPressStream
					.pipe(isMenuButtonPressNavigatedTo(currentDocument))
					.pipe(isNavigated => isNavigated && this.loadData().then(this.setState.bind(this)));

				this.loadData().then(payload => {
					this.setState(assign({loading: false}, payload));
				});
			},

			componentWillUnmount() {
				this.menuButtonPressStream.unsubscribe();
			},

			shouldComponentUpdate: deepEqualShouldUpdate,

			loadData() {
				return getAllTVShows().then(series => ({series}));
			},

			render() {
				if (this.state.loading) {
					return <Loader />;
				}

				let {title: titleCode, reducer} = sections[this.state.groupId];
				let groups = reducer(this.state.series);
				let title = i18n(titleCode);

				return (
					<document>
						<stackTemplate>
							<banner>
								<title>
									{i18n('all-caption')}
								</title>
							</banner>
							<collectionList>
								<separator>
									<button onSelect={this.onSwitchGroup}>
										<text>
											{i18n('all-group-by-title', {title})}
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
											{items.map(tvshow => {
												let {
													sid,
													watching,
													unwatched,
													covers: {big: poster},
												} = tvshow;

												let title = i18n('tvshow-title', tvshow);

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
								<title>
									{i18n('all-group-by')}
								</title>
								{sectionsList.map(({id, title: titleCode}) => (
									<button
										key={id}
										onSelect={this.onGroupSelect.bind(this, id)}
										autoHighlight={id === this.state.groupId || undefined}
									>
										<text>{i18n(titleCode)}</text>
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
