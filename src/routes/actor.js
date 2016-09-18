/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

import {getActorInfo} from '../request/soap';

import Tile from '../components/tile';
import Loader from '../components/loader';

export default function(title) {
	return TVDML
		.createPipeline()
		.pipe(TVDML.passthrough(({navigation: {id, actor}}) => ({id, actor})))
		.pipe(TVDML.render(({actor}) => {
			return <Loader title={actor} />;
		}))
		.pipe(TVDML.passthrough(({id}) => {
			return getActorInfo(id).then(({bio, soap: tvshows}) => ({bio, tvshows}));
		}))
		.pipe(TVDML.render(({bio, tvshows}) => {
			let {
				name_en,
				image_original,
			} = bio;

			let [firstName, lastName] = name_en.split(' ');

			return (
				<document>
					<stackTemplate>
						<banner>
							<heroImg src={image_original} />
						</banner>
						<collectionList>
							<shelf centered="true">
								<section>
									<monogramLockup disabled="true">
										<monogram
											style="tv-placeholder: monogram"
											src={image_original}
											firstName={firstName}
											lastName={lastName}
										/>
										<title>{name_en}</title>
										<subtitle>Actor</subtitle>
									</monogramLockup>
								</section>
							</shelf>
							<grid>
								<header>
									<title>TV Shows</title>
								</header>
								<section>
									{tvshows.map(({title, sid, covers: {big: poster}}) => {
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
