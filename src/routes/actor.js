import * as TVDML from 'tvdml';

import { get as i18n } from '../localization';
import { getActorInfo } from '../request/soap';

import Tile from '../components/tile';
import Loader from '../components/loader';

export default function actorRoute(title) {
  return TVDML
    .createPipeline()
    .pipe(TVDML.passthrough(({
      navigation: {
        id,
        actor,
        poster,
      },
    }) => ({ id, actor, poster })))
    .pipe(TVDML.render(({ actor, poster }) => (
      <Loader title={actor} heroImg={poster} />
    )))
    .pipe(TVDML.passthrough(({ id }) => getActorInfo(id).then(({
      bio,
      soap: tvshows,
    }) => ({ bio, tvshows }))))
    .pipe(TVDML.render(({ bio, tvshows }) => {
      const {
        name_en: actorName,
        image_original: actorImage,
      } = bio;

      const [firstName, lastName] = actorName.split(' ');

      return (
        <document>
          <stackTemplate>
            <banner>
              <heroImg src={actorImage} />
            </banner>
            <collectionList>
              <shelf centered="true">
                <section>
                  <monogramLockup disabled="true">
                    <monogram
                      style="tv-placeholder: monogram"
                      src={actorImage}
                      firstName={firstName}
                      lastName={lastName}
                    />
                    <title>{actorName}</title>
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
                    const {
                      sid,
                      covers: { big: poster },
                    } = tvshow;

                    const tvShowTitle = i18n('tvshow-title', tvshow);

                    return (
                      <Tile
                        title={tvShowTitle}
                        poster={poster}
                        route="tvshow"
                        payload={{
                          sid,
                          poster,
                          title: tvShowTitle,
                        }}
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
