/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';

import {getMyTVShows} from '../request/soap';

import Tile from '../components/tile';
import Loader from '../components/loader';

export default function(title) {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(<Loader />))
		.pipe(TVDML.passthrough(() => getMyTVShows().then(series => ({series}))))
		.pipe(TVDML.render(({series}) => {
			let watching = series.filter(({watching}) => watching > 0);
			let others = series.filter(({watching}) => watching < 1);

			let ongoing = watching.filter(({status, unwatched}) => status == 0 || unwatched > 0);
			let unwatched = ongoing.filter(({unwatched}) => unwatched > 0);
			let watched = ongoing.filter(({unwatched}) => !unwatched);
			let closed = watching.filter(({status, unwatched}) => status > 0 && !unwatched);

			return (
				<document>
					<stackTemplate>
						<banner>
							<title>{title}</title>
						</banner>
						<collectionList>
							{renderSectionGrid(unwatched, 'New episodes')}
							{renderSectionGrid(watched, 'Watched')}
							{renderSectionGrid(closed, 'Closed')}
						</collectionList>
					</stackTemplate>
				</document>
			);
		}));
}

function renderSectionGrid(collection, title) {
	let header;

	if (title) {
		header = (
			<header>
				<title>{title}</title>
			</header>
		)
	}

	return (
		<grid>
			{header}
			<section>
				{collection.map(({title, sid, unwatched}) => {
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
	)
}
