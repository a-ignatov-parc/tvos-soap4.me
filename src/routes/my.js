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
			return get('https://soap4.me/api/soap/my/').then(series => ({series}));
		}))
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
				{collection.map(tvshow => {
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
	)
}
