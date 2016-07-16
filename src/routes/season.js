/** @jsx TVDML.jsx */

import plur from 'plur';
import * as TVDML from 'tvdml';

import {getDefault} from '../quality';
import {link, fixSpecialSymbols} from '../utils';

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.passthrough(({navigation: {TVSeries, season}}) => ({TVSeries, season})))
		.pipe(TVDML.render(({TVSeries, season}) => {
			let {
				sid,
				title,
				description,
			} = TVSeries;

			let {
				id,
			} = season;

			let episodes = season.episodes.map(getDefault);
			let posterUrl = `http://covers.soap4.me/season/big/${id}.jpg`;

			return (
				<document>
					<listTemplate>
						<banner>
							<title>{title}</title>
						</banner>
						<list>
							<header>
								<title>Season {season.season}</title>
							</header>
							<section>
								{episodes.map(({title_en, spoiler, watched}) => {
									return (
										<listItemLockup>
											<title>
												{fixSpecialSymbols(title_en)} {watched && <badge src="resource://button-checkmark" />}
											</title>
											<relatedContent>
												<lockup>
													<img src={posterUrl} width="400" height="400" />
													<description>{spoiler}</description>
												</lockup>
											</relatedContent>
										</listItemLockup>
									);
								})}
							</section>
						</list>
					</listTemplate>
				</document>
			);
		}));
}
