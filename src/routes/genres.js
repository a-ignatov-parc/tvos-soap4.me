/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
import assign from 'object-assign';

import {get as i18n} from '../localization';

import {
	getGenresList,
	getTVShowsByGenre,
} from '../request/soap';

import {capitalizeText, genreToId} from '../utils';
import {deepEqualShouldUpdate} from '../utils/components';

import Tile from '../components/tile';
import Loader from '../components/loader';

const {Promise} = TVDML;

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				return {
					genres: [],
					active: null,
					loading: true,
				};
			},

			componentDidMount() {
				this.loadData().then(payload => {
					this.setState(assign({loading: false}, payload));
				});
			},

			shouldComponentUpdate: deepEqualShouldUpdate,

			loadData() {
				return getGenresList().then(genres => ({genres}));
			},

			render() {
				const {
					genres,
					loading,
				} = this.state;

				console.log(111, this.state);

				if (loading) {
					return <Loader />;
				}

				return (
					<document>
						<catalogTemplate>
							<banner>
								<title>Genres</title>
							</banner>
							<list>
								<section>
									{genres.map(genre => {
										const id = genreToId(genre);
										const tvshows = this.state[id];

										return (
											<listItemLockup
												key={genre}
												onHighlight={this.onGenreSelect.bind(this, genre)}
											>
												<title>
													{capitalizeText(genre)}
												</title>
												<decorationLabel>
													{tvshows ? tvshows.length : '…'}
												</decorationLabel>
												<relatedContent>
													{tvshows == null ? (
														<activityIndicator />
													) : (
														<grid>
															<section>
																{tvshows.map(tvshow => {
																	const {
																		sid,
																		watching,
																		unwatched,
																		covers: {big: poster},
																	} = tvshow;

																	const title = i18n('tvshow-title', tvshow);

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
													)}
												</relatedContent>
											</listItemLockup>
										);
									})}
								</section>
							</list>
						</catalogTemplate>
					</document>
				);
			},

			onGenreSelect(genre) {
				const id = genreToId(genre);
				this.setState({active: id});
				if (this.state[id] != null) return;
				getTVShowsByGenre(genre).then(tvshows => this.setState({[id]: tvshows}));
			},
		})));
}
