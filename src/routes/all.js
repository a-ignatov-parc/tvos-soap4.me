/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';

import {link} from '../utils';
import {get} from '../request/soap';

import Loader from '../components/loader';

export default function(title) {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(<Loader title={title} />))
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
									{series.map(TVSeries => {
										let {title, sid, unwatched} = TVSeries;
										let posterUrl = `http://covers.soap4.me/soap/big/${sid}.jpg`;

										return (
											<lockup onSelect={link('tv-series', {TVSeries})}>
												<img src={posterUrl} width="250" height="250" />
												<title>{title}</title>
												<title>
													{unwatched && `${unwatched} ${plur('episode', unwatched)}`}
												</title>
											</lockup>
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
