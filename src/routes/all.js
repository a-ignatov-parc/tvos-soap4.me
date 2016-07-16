/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';
import {get} from '../request/soap';

import Tile from '../components/tile';
import Loader from '../components/loader';

export default function(title) {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(<Loader />))
		.pipe(TVDML.passthrough(() => {
			return get('https://soap4.me/api/soap/').then(series => ({series}));
		}))
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
									{series.map(tvshow => {
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
