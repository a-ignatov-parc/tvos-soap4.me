/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';
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
		.pipe(TVDML.passthrough(({actor}) => {
			return parseActorPage(actor);
		}))
		.pipe(TVDML.render(({actor, tvshows}) => {
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
										let {title, sid} = tvshow;
										let poster = `http://covers.soap4.me/soap/big/${sid}.jpg`;

										return (
											<Tile
												title={title}
												poster={poster}
												route="tvshow"
												payload={{sid, title}}
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
