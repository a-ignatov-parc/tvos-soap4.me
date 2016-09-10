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

import Loader from './components/loader';

TVDML
	.subscribe(TVDML.event.LAUNCH)
	.pipe(() => TVDML.navigate('get-token'));

TVDML
	.handleRoute('get-token')
	.pipe(TVDML.render(<Loader title="Checking authorization..." />))
	.pipe(() => checkSession().then(({logged, token, till}) => user.set({logged, token, till})))
	.pipe(() => TVDML.redirect('main'));

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
						<title>My Series</title>
					</menuItem>
					<menuItem route="all">
						<title>All Series</title>
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
	.pipe(MyRoute('My Series'));

TVDML
	.handleRoute('all')
	.pipe(AllRoute('All Series'));

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
