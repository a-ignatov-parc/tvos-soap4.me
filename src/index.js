/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
import * as user from './user';

import {get as i18n} from './localization';
import {checkSession, migrateToFamilyAccount, getFamilyAccounts} from './request/soap';

import MyRoute from './routes/my';
import AllRoute from './routes/all';
import MenuRoute from './routes/menu';
import UserRoute from './routes/user';
import ActorRoute from './routes/actor';
import SeasonRoute from './routes/season';
import TVShowRoute from './routes/tvshow';
import SearchRoute from './routes/search';
import SettingsRoute from './routes/settings';
import SpeedTestRoute from './routes/speedtest';

import Loader from './components/loader';

TVDML
	.subscribe(TVDML.event.LAUNCH)
	.pipe(() => TVDML.navigate('get-token'));

TVDML
	.handleRoute('get-token')
	.pipe(TVDML.render(<Loader title={i18n('auth-checking')} />))
	.pipe(() => checkSession().then(({logged, token, till}) => user.set({logged, token, till})))
	.pipe(() => getFamilyAccounts().then(({family, selected}) => user.set({family, selected})))
	.pipe(({family}) => {
		if (family.length) {
			TVDML.redirect('user');
			// TVDML.redirect('main');
		} else {
			TVDML.redirect('family-account-migration');
		}
	});

TVDML
	.handleRoute('family-account-migration')
	.pipe(TVDML.render(<Loader title={i18n('account-migration')} />))
	.pipe(() => migrateToFamilyAccount())
	.pipe(() => TVDML.redirect('get-token'));

TVDML
	.handleRoute('main')
	.pipe(MenuRoute([
		{
			route: 'search',
		}, {
			route: 'my',
			active: true,
		}, {
			route: 'all',
		}, {
			route: 'settings',
		},
	]));

TVDML
	.handleRoute('my')
	.pipe(MyRoute());

TVDML
	.handleRoute('all')
	.pipe(AllRoute());

TVDML
	.handleRoute('search')
	.pipe(SearchRoute());

TVDML
	.handleRoute('settings')
	.pipe(SettingsRoute());

TVDML
	.handleRoute('tvshow')
	.pipe(TVShowRoute());

TVDML
	.handleRoute('season')
	.pipe(SeasonRoute());

TVDML
	.handleRoute('actor')
	.pipe(ActorRoute());

TVDML
	.handleRoute('speedtest')
	.pipe(SpeedTestRoute());

TVDML
	.handleRoute('user')
	.pipe(UserRoute());
