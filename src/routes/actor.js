/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';
import {get} from '../request/soap';
import {parseActorPage} from '../info';

import Tile from '../components/tile';
import Loader from '../components/loader';

export default function(title) {
	return TVDML
		.createPipeline()
		.pipe(TVDML.passthrough(({navigation: {actor}}) => ({actor})))
		.pipe(TVDML.render(({actor}) => {
			return <Loader title={actor} />;
		}))
		.pipe(TVDML.passthrough(() => {
			return get(`https://soap4.me/api/soap/`).then(series => ({series}));
		}))
		.pipe(TVDML.passthrough(({actor, series}) => {
			return parseActorPage(actor).then(({tvshows}) => ({
				tvshows: tvshows
					.map(({sid}) => {
						let tvshow;

						series.some((item) => {
							if (item.sid === sid) {
								tvshow = item;
								return true;
							}
						});

						return tvshow;
					})
					.filter(Boolean)
			}));
		}))
		.pipe(TVDML.render(({actor, tvshows}) => {
			console.log('actor', actor, tvshows);
			return (
				<document>
					<stackTemplate>
						<banner>
							<title>{actor}</title>
						</banner>
						<collectionList>
							<grid>
								<section>
									{tvshows.map(tvshow => {
										let {title, sid, unwatched} = tvshow;
										let poster = `http://covers.soap4.me/soap/big/${sid}.jpg`;

										return (
											<Tile
												title={title}
												poster={poster}
												route="tvshow"
												payload={{tvshow}}
												subtitle={unwatched && `${unwatched} ${plur('episode', unwatched)}`}
											/>
										);
									})}
								</section>
							</grid>
						</collectionList>
					</stackTemplate>
				</document>
			);
		}));
}
