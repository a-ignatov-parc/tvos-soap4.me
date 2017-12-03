/* global sessionStorage */

import * as TVDML from 'tvdml';

import * as user from './user';
import { processFamilyAccount } from './user/utils';

import { get as i18n } from './localization';
import { checkSession } from './request/soap';

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

import { AUTH, GUEST } from './routes/menu/constants';

import Loader from './components/loader';

TVDML
  .subscribe(TVDML.event.LAUNCH)
  .pipe(params => {
    /**
     * TODO: Need to save initial params in a better way then
     * using `sessionStorage`. Maybe some in-memory storage.
     */
    sessionStorage.setItem('startParams', JSON.stringify(params));
    return TVDML.navigate('get-token');
  });

TVDML
  .handleRoute('get-token')
  .pipe(TVDML.render(<Loader title={i18n('auth-checking')} />))
  .pipe(checkSession)
  .pipe(payload => {
    const { logged, token, till } = payload;
    user.set({ logged, token, till });
    return payload;
  })
  .pipe(({ login }) => processFamilyAccount(login))
  .pipe(() => TVDML.redirect('main'));

TVDML
  .handleRoute('main')
  .pipe(menuRoute([
    {
      route: 'search',
    }, {
      route: 'my',
      active: AUTH,
      hidden: GUEST,
    }, {
      route: 'all',
      active: GUEST,
    }, {
      route: 'genres',
    }, {
      route: 'settings',
    },
  ]));

TVDML
  .handleRoute('my')
  .pipe(myRoute());

TVDML
  .handleRoute('all')
  .pipe(allRoute());

TVDML
  .handleRoute('search')
  .pipe(searchRoute());

TVDML
  .handleRoute('settings')
  .pipe(settingsRoute());

TVDML
  .handleRoute('tvshow')
  .pipe(tvShowRoute());

TVDML
  .handleRoute('season')
  .pipe(seasonRoute());

TVDML
  .handleRoute('actor')
  .pipe(actorRoute());

TVDML
  .handleRoute('speedtest')
  .pipe(speedTestRoute());

TVDML
  .handleRoute('user')
  .pipe(userRoute());

TVDML
  .handleRoute('genres')
  .pipe(genresRoute());
