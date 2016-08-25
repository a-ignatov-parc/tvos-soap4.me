/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';

import {getSearchResults} from '../request/soap';

import {
	fixSpecialSymbols,
	prettifyEpisodeNum,
} from '../utils';

import Tile from '../components/tile';

const {Promise} = TVDML;

const THROTTLE_TIMEOUT = 500;

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				return {
					series: [],
					episodes: [],
				};
			},

			render() {
				let tvshows = this.state.episodes.reduce((result, item) => {
					if (!result[item.soap_en]) {
						result[item.soap_en] = [];
					}
					result[item.soap_en].push(item);
					return result;
				}, {});
				let episodes = Object.keys(tvshows);

				return (
					<document>
						<searchTemplate>
							<searchField ref={node => this.searchField = node} />
							<collectionList>
								{this.state.series.length && this.renderShows()}
								{episodes.map(name => this.renderEpisodes(name, tvshows[name]))}
							</collectionList>
						</searchTemplate>
					</document>
				);
			},

			renderShows() {
				return (
					<shelf>
						<header>
							<title>TV Shows</title>
						</header>
						<section>
							{this.state.series.map(({title, sid}) => {
								let poster = `http://covers.soap4.me/soap/big/${sid}.jpg`;

								return (
									<Tile
										title={title}
										route="tvshow"
										poster={poster}
										payload={{title, sid}}
									/>
								);
							})}
						</section>
					</shelf>
				);
			},

			renderEpisodes(title, list) {
				return (
					<shelf>
						<header>
							<title>{title}</title>
						</header>
						<section>
							{list.map(({
								sid,
								season,
								episode,
								soap_en,
								season_id: id,
								title_en: title,
							}) => {
								let seasonTitle = `Season ${season}`;
								let poster = `http://covers.soap4.me/season/big/${id}.jpg`;

								return (
									<Tile
										title={fixSpecialSymbols(title)}
										route="season"
										poster={poster}
										payload={{sid, id, episode, title: `${soap_en} — ${seasonTitle}`}}
										subtitle={prettifyEpisodeNum(season, episode)}
									/>
								);
							})}
						</section>
					</shelf>
				);
			},

			componentDidMount() {
				let keyboard = this.searchField.getFeature('Keyboard');
				keyboard.onTextChange = () => this.search(keyboard.text);
			},

			search(query) {
				this.throttle && clearTimeout(this.throttle);
				this.throttle = setTimeout(this.loadResults.bind(this, query), THROTTLE_TIMEOUT);
			},

			loadResults(query) {
				return getSearchResults(query).then(this.setState.bind(this));
			},
		})));
}
