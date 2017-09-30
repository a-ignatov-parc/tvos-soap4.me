import * as TVDML from 'tvdml';

import {get as i18n} from '../localization';
import {getActorInfo} from '../request/soap';

import Tile from '../components/tile';
import Loader from '../components/loader';

export default function(title) {
	return TVDML
		.createPipeline()
		.pipe(TVDML.passthrough(({navigation: {id, actor, poster}}) => ({id, actor, poster})))
		.pipe(TVDML.render(({actor, poster}) => {
			return <Loader title={actor} heroImg={poster} />;
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
										<subtitle>
											{i18n('actor-title')}
										</subtitle>
									</monogramLockup>
								</section>
							</shelf>
							<grid>
								<header>
									<title>
										{i18n('actor-tvshows')}
									</title>
								</header>
								<section>
									{tvshows.map(tvshow => {
										let {
											sid,
											covers: {big: poster},
										} = tvshow;

										let title = i18n('tvshow-title', tvshow);

										return (
											<Tile
												title={title}
												poster={poster}
												route="tvshow"
												payload={{sid, title, poster}}
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
