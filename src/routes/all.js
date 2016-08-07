/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';

import {getAllTVShows} from '../request/soap';

import Tile from '../components/tile';
import Loader from '../components/loader';

export default function(title) {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(<Loader />))
		.pipe(TVDML.passthrough(() => getAllTVShows().then(series => ({series}))))
		.pipe(TVDML.render(({series}) => {
			return (
				<document>
					<stackTemplate>
						<banner>
							<title>{title}</title>
						</banner>
						<collectionList>
							<grid>
								<section>
									{series.map(({title, sid, unwatched}) => {
										let poster = `http://covers.soap4.me/soap/big/${sid}.jpg`;

										return (
											<Tile
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
						</collectionList>
					</stackTemplate>
				</document>
			);
		}));
}
