/* global sessionStorage, navigationDocument */

import * as TVDML from 'tvdml';

import * as user from './user';
import { processFamilyAccount } from './user/utils';

import { get as i18n } from './localization';
import { checkSession } from './request/soap';
import { getStartParams, getOpenURLParams, isQello } from './utils';

import myRoute from './routes/my';
import menuRoute from './routes/menu';
import userRoute from './routes/user';
import actorRoute from './routes/actor';
import seasonRoute from './routes/season';
import tvShowRoute from './routes/tvshow';
import tvShowsRoute from './routes/tvshows';
import movieRoute from './routes/movie';
import moviesRoute from './routes/movies';
import movieActorRoute from './routes/movie-actor';
import movieWriterRoute from './routes/movie-writer';
import movieDirectorRoute from './routes/movie-director';
import searchRoute from './routes/search';
import settingsRoute from './routes/settings';
import speedTestRoute from './routes/speedtest';

import { AUTH, GUEST } from './routes/menu/constants';

import Loader from './components/loader';

function openURLHandler(openURL) {
  const mainRoute = navigationDocument.documents.find(
    ({ route }) => route === 'main',
  );

  if (mainRoute) {
    navigationDocument.popToDocument(mainRoute);
  }

  TVDML.navigate(...getOpenURLParams(openURL));
}

TVDML.subscribe(TVDML.event.LAUNCH).pipe(params => {
  /**
   * TODO: Need to save initial params in a better way then
   * using `sessionStorage`. Maybe some in-memory storage.
   */
  sessionStorage.setItem('startParams', JSON.stringify(params));
  return TVDML.navigate('get-token');
});

TVDML.handleRoute('get-token')
  .pipe(TVDML.render(<Loader title={i18n('auth-checking')} />))
  .pipe(checkSession)
  .pipe(session => {
    user.set(session);
    return processFamilyAccount(session.login);
  })
  .pipe(() => {
    TVDML.redirect('main');

    if (!isQello()) {
      // register openURLHandler after "main" screen goes on top of the stack
      // and call it synchronously if app opened with url
      // to instantly show proper screen
      global.openURLHandler = openURLHandler;

      const { openURL } = getStartParams();

      if (openURL) {
        global.openURLHandler(openURL);
      }
    }
  });

TVDML.handleRoute('main').pipe(
  // There should be no more than 6 items, or Apple TV will start hiding the rest
  menuRoute([
    {
      route: 'search',
    },
    {
      route: 'my',
      active: AUTH,
      hidden: GUEST,
    },
    {
      route: 'tvshows',
      active: GUEST,
    },
    {
      route: 'movies',
      hidden: GUEST,
    },
    {
      route: 'settings',
    },
  ]),
);

TVDML.handleRoute('my').pipe(myRoute());

TVDML.handleRoute('tvshows').pipe(tvShowsRoute());

TVDML.handleRoute('movies').pipe(moviesRoute());

TVDML.handleRoute('movie').pipe(movieRoute());

TVDML.handleRoute('movie-director').pipe(movieDirectorRoute());

TVDML.handleRoute('movie-writer').pipe(movieWriterRoute());

TVDML.handleRoute('movie-actor').pipe(movieActorRoute());

TVDML.handleRoute('search').pipe(searchRoute());

TVDML.handleRoute('settings').pipe(settingsRoute());

TVDML.handleRoute('tvshow').pipe(tvShowRoute());

TVDML.handleRoute('season').pipe(seasonRoute());

TVDML.handleRoute('actor').pipe(actorRoute());

TVDML.handleRoute('speedtest').pipe(speedTestRoute());

TVDML.handleRoute('user').pipe(userRoute());
