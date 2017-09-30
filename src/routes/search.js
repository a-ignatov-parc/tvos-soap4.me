import * as TVDML from 'tvdml';

import {get as i18n} from '../localization';
import {link, prettifyEpisodeNum} from '../utils';
import {processEntitiesInString} from '../utils/parser';
import {
	getSearchResults,
	getLatestTVShows,
	getPopularTVShows,
} from '../request/soap';

import Tile from '../components/tile';

const {Promise} = TVDML;

const THROTTLE_TIMEOUT = 500;

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				return {
					value: '',
					loading: false,
					updating: false,
					latest: [],
					series: [],
					popular: [],
					persons: [],
					episodes: [],
				};
			},

			render() {
				let tvshows = this.state.episodes.reduce((result, item) => {
					let title = i18n('tvshow-title-from-episode', item);
					if (!result[title]) result[title] = [];
					result[title].push(item);
					return result;
				}, {});

				let episodes = Object.keys(tvshows);

				return (
					<document>
						<head>
							<style content={`
								.shelf_indent {
									margin: 0 0 60;
								}
							`} />
						</head>
						<searchTemplate>
							<searchField
								ref={node => this.searchField = node}
								showSpinner={this.state.loading ? 'true' : undefined}
							/>
							<collectionList>
								{this.renderLatest()}
								{this.renderPopular()}
								{this.renderPersons()}
								{this.renderShows()}
								{episodes.map((name, i) => this.renderEpisodes(name, tvshows[name], (i + 1) === episodes.length))}
							</collectionList>
						</searchTemplate>
					</document>
				);
			},

			renderLatest() {
				if (!this.state.latest.length || this.state.value) return null;

				return (
					<shelf>
						<header>
							<title>
								{i18n('search-latest')}
							</title>
						</header>
						<section>
							{this.state.latest.map(tvshow => {
								let {
									sid,
									covers: {big: poster},
								} = tvshow;

								let title = i18n('tvshow-title', tvshow);

								return (
									<Tile
										title={title}
										route="tvshow"
										poster={poster}
										payload={{title, sid, poster}}
									/>
								);
							})}
						</section>
					</shelf>
				);
			},

			renderPopular() {
				if (!this.state.popular.length || this.state.value) return null;

				return (
					<shelf>
						<header>
							<title>
								{i18n('search-popular')}
							</title>
						</header>
						<section>
							{this.state.popular.map(tvshow => {
								let {
									sid,
									covers: {big: poster},
								} = tvshow;

								let title = i18n('tvshow-title', tvshow);

								return (
									<Tile
										title={title}
										route="tvshow"
										poster={poster}
										payload={{title, sid, poster}}
									/>
								);
							})}
						</section>
					</shelf>
				);
			},

			renderPersons() {
				if (!this.state.persons.length) return null;

				return (
					<shelf class="shelf_indent">
						<header>
							<title>
								{i18n('search-persons')}
							</title>
						</header>
						<section>
							{this.state.persons.map(actor => {
								let {
									id,
									name_en,
									image_original,
								} = actor;

								let [firstName, lastName] = name_en.split(' ');

								return (
									<monogramLockup
										key={id}
										onSelect={link('actor', {id, actor: name_en, poster: image_original})}
									>
										<monogram 
											style="tv-placeholder: monogram"
											src={image_original}
											firstName={firstName}
											lastName={lastName}
										/>
										<title>{name_en}</title>
										<subtitle>
											{i18n('search-actor')}
										</subtitle>
									</monogramLockup>
								);
							})}
						</section>
					</shelf>
				);
			},

			renderShows() {
				if (!this.state.series.length) return null;

				return (
					<shelf class="shelf_indent">
						<header>
							<title>
								{i18n('search-tvshows')}
							</title>
						</header>
						<section>
							{this.state.series.map(tvshow => {
								let {
									sid,
									covers: {big: poster},
								} = tvshow;

								let title = i18n('tvshow-title', tvshow);

								return (
									<Tile
										title={title}
										route="tvshow"
										poster={poster}
										payload={{title, sid, poster}}
									/>
								);
							})}
						</section>
					</shelf>
				);
			},

			renderEpisodes(title, list, isLast) {
				return (
					<shelf class={isLast ? undefined : 'shelf_indent'}>
						<header>
							<title>{title}</title>
						</header>
						<section>
							{list.map(episode => {
								let {
									sid,
									season: seasonNumber,
									episode: episodeNumber,
									covers: {big: poster},
								} = episode;

								let seasonTitle = i18n('tvshow-season', {seasonNumber});
								let episodeTitle = processEntitiesInString(i18n('tvshow-episode-title', episode));

								return (
									<Tile
										title={episodeTitle}
										route="season"
										poster={poster}
										payload={{sid, id: seasonNumber, episodeNumber, title: `${title} — ${seasonTitle}`, poster}}
										subtitle={prettifyEpisodeNum(seasonNumber, episodeNumber)}
									/>
								);
							})}
						</section>
					</shelf>
				);
			},

			componentDidMount() {
				const keyboard = this.searchField.getFeature('Keyboard');

				keyboard.onTextChange = () => this.search(keyboard.text);

				this.loadData().then(payload => {
					this.setState({loading: false, ...payload});
				});
			},

			componentWillReceiveProps(nextProps) {
				this.setState({updating: true});
			},

			componentDidUpdate(prevProps, prevState) {
				if (this.state.updating && prevState.updating !== this.state.updating) {
					this.loadData().then(payload => {
						this.setState({updating: false, ...payload});
					});
				}
			},

			loadData() {
				return Promise
					.all([
						getLatestTVShows(),
						getPopularTVShows(),
					])
					.then(([latest, popular]) => ({latest, popular}));
			},

			search(query) {
				this.setState({value: query});
				this.throttle && clearTimeout(this.throttle);
				this.throttle = setTimeout(this.loadResults.bind(this, query), THROTTLE_TIMEOUT);
			},

			loadResults(query) {
				this.setState({loading: true});
				return getSearchResults(query)
					.catch(() => ({}))
					.then(result => this.setState({loading: false, ...result}));
			},
		})));
}
