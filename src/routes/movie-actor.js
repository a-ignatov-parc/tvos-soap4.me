import * as TVDML from 'tvdml';

import { get as i18n } from '../localization';

import { getActorMovies } from '../request/soap';

import Tile from '../components/tile';
import Loader from '../components/loader';
import { movieIsUHD } from '../utils';

export default function movieActorRoute() {
  return TVDML.createPipeline()
    .pipe(
      TVDML.passthrough(({ navigation: { id, name } }) => ({
        id,
        name,
      })),
    )
    .pipe(TVDML.render(({ name }) => <Loader title={name} />))
    .pipe(
      TVDML.passthrough(({ id }) =>
        getActorMovies(id).then(movies => ({ movies })),
      ),
    )
    .pipe(
      TVDML.render(({ name, movies }) => {
        const [firstName, lastName] = name.split(' ');

        return (
          <document>
            <stackTemplate>
              <collectionList>
                <shelf centered="true">
                  <section>
                    <monogramLockup disabled="true">
                      <monogram
                        style="tv-placeholder: monogram"
                        firstName={firstName}
                        lastName={lastName}
                      />
                      <title>{name}</title>
                      <subtitle>{i18n('actor-title')}</subtitle>
                    </monogramLockup>
                  </section>
                </shelf>
                <grid>
                  <header>
                    <title>{i18n('actor-movies')}</title>
                  </header>
                  <section>
                    {movies.map(movie => {
                      const {
                        id,
                        covers: { big: poster },
                      } = movie;

                      const movieTitle = i18n('movie-title', movie);

                      return (
                        <Tile
                          title={movieTitle}
                          poster={poster}
                          route="movie"
                          isUHD={movieIsUHD(movie)}
                          payload={{
                            id,
                            poster,
                            title: movieTitle,
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
      }),
    );
}
