/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
import * as user from './user';
import {processFamilyAccount} from './user/utils';

import {get as i18n} from './localization';
import {checkSession, getFamilyAccounts} from './request/soap';

import MyRoute from './routes/my';
import AllRoute from './routes/all';
import MenuRoute from './routes/menu';
import UserRoute from './routes/user';
import ActorRoute from './routes/actor';
import SeasonRoute from './routes/season';
import TVShowRoute from './routes/tvshow';
import SearchRoute from './routes/search';
import GenresRoute from './routes/genres';
import SettingsRoute from './routes/settings';
import SpeedTestRoute from './routes/speedtest';

import {AUTH, GUEST} from './routes/menu/constants';

import Loader from './components/loader';

TVDML
	.subscribe(TVDML.event.LAUNCH)
	.pipe(() => TVDML.navigate('get-token'));

TVDML
	.handleRoute('get-token')
	.pipe(TVDML.render(<Loader title={i18n('auth-checking')} />))
	.pipe(checkSession)
	.pipe(payload => {
		const {logged, token, till} = payload;
		user.set({logged, token, till});
		return payload;
	})
	.pipe(({login}) => processFamilyAccount(login))
	.pipe(() => TVDML.redirect('main'));
	// 
	// Testing routes
	// .pipe(() => TVDML.redirect('tvshow', {sid: '296', title: 'Arrow'}));
	// .pipe(() => TVDML.redirect('season', {sid: '296', id: '4', title: 'Arrow — Season 4'}));
	// .pipe(() => TVDML.redirect('tvshow', {sid: '692', title: 'Bref'}));
	// .pipe(() => TVDML.redirect('season', {sid: '692', id: '1', title: 'Bref — Season 1'}));

TVDML
	.handleRoute('main')
	.pipe(MenuRoute([
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

TVDML
	.handleRoute('genres')
	.pipe(GenresRoute());
