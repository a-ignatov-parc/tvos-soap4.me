/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
import assign from 'object-assign';

import * as token from '../token';
import {get} from '../request';

import Loader from '../components/loader';

const headers = {
	'User-Agent': 'xbmc for soap',
};

export default TVDML
	.createPipeline()
	.pipe(TVDML.render(<Loader title="Loading..." />))
	.pipe(TVDML.passthrough(() => {
		let requestHeaders = assign({}, headers, {
			'X-Api-Token': token.get(),
		});

		return get('https://soap4.me/api/soap/', requestHeaders).then(series => {
			return {series};
		});
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
						<title>TV Series</title>
					</banner>
					<collectionList>
						{renderSectionGrid(unwatched, 'New episodes')}
						{renderSectionGrid(watched, 'Watched')}
						{renderSectionGrid(closed, 'Closed')}
					</collectionList>
				</stackTemplate>
			</document>
		);
	}))

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
				{collection.map(({title, sid}) => {
					let posterUrl = `http://covers.soap4.me/soap/big/${sid}.jpg`;

					return (
						<lockup>
							<img src={posterUrl} width="200" height="200" />
							<title>{title}</title>
						</lockup>
					);
				})}
			</section>
		</grid>
	)
}
