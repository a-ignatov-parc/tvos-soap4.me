/* global sessionStorage, navigationDocument */

import * as TVDML from 'tvdml';

import * as user from './user';
import { processFamilyAccount } from './user/utils';

import { get as i18n } from './localization';
import { checkSession } from './request/soap';
import { getStartParams, getOpenURLParams, isQello } from './utils';

import myRoute from './routes/my';
import allRoute from './routes/all';
import menuRoute from './routes/menu';
import userRoute from './routes/user';
import actorRoute from './routes/actor';
import seasonRoute from './routes/season';
import tvShowRoute from './routes/tvshow';
import searchRoute from './routes/search';
import genresRoute from './routes/genres';
import settingsRoute from './routes/settings';
import speedTestRoute from './routes/speedtest';
import myRecomendations from './routes/recomendations';

import { AUTH, BASIC, GUEST } from './routes/menu/constants';

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
  .pipe(payload => {
    const { logged, token, till } = payload;
    user.set({ logged, token, till });
    return payload;
  })
  .pipe(({ login }) => processFamilyAccount(login))
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
      route: 'all',
      active: GUEST,
    },
    {
      route: 'recomendations',
      hidden: [GUEST, BASIC],
    },
    {
      route: 'genres',
    },
    {
      route: 'settings',
    },
  ]),
);

TVDML.handleRoute('my').pipe(myRoute());

TVDML.handleRoute('all').pipe(allRoute());

TVDML.handleRoute('search').pipe(searchRoute());

TVDML.handleRoute('settings').pipe(settingsRoute());

TVDML.handleRoute('tvshow').pipe(tvShowRoute());

TVDML.handleRoute('season').pipe(seasonRoute());

TVDML.handleRoute('actor').pipe(actorRoute());

TVDML.handleRoute('speedtest').pipe(speedTestRoute());

TVDML.handleRoute('user').pipe(userRoute());

TVDML.handleRoute('genres').pipe(genresRoute());

TVDML.handleRoute('recomendations').pipe(myRecomendations());
