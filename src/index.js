/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
import * as user from './user';

import {checkSession} from './request/soap';

import MyRoute from './routes/my';
import AllRoute from './routes/all';
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
	.pipe(TVDML.render(<Loader title="Checking authorization..." />))
	.pipe(() => checkSession().then(({logged, token, till}) => user.set({logged, token, till})))
	.pipe(() => TVDML.redirect('main'));
	// 
	// Testing routes
	// .pipe(() => TVDML.redirect('tvshow', {sid: '296', title: 'Arrow'}));
	// .pipe(() => TVDML.redirect('season', {sid: '296', id: '4', title: 'Arrow — Season 4'}));
	// .pipe(() => TVDML.redirect('tvshow', {sid: '692', title: 'Bref'}));
	// .pipe(() => TVDML.redirect('season', {sid: '692', id: '1', title: 'Bref — Season 1'}));

TVDML
	.handleRoute('main')
	.pipe(TVDML.render(
		<document>
			<menuBarTemplate>
				<menuBar>
					<menuItem route="search">
						<title>Search</title>
					</menuItem>
					<menuItem autoHighlight="true" route="my">
						<title>My TV Shows</title>
					</menuItem>
					<menuItem route="all">
						<title>All TV Shows</title>
					</menuItem>
					<menuItem route="settings">
						<title>Settings</title>
					</menuItem>
				</menuBar>
			</menuBarTemplate>
		</document>
	));

TVDML
	.handleRoute('my')
	.pipe(MyRoute('My TV Shows'));

TVDML
	.handleRoute('all')
	.pipe(AllRoute('All TV Shows'));

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
