/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
import * as token from './token';

import Loader from './components/loader';

import MyRoute from './routes/my';
import AllRoute from './routes/all';
import AuthRoute from './routes/auth';
import ActorRoute from './routes/actor';
import SeasonRoute from './routes/season';
import TVShowRoute from './routes/tvshow';

TVDML
	.subscribe(TVDML.event.LAUNCH)
	.pipe(() => {
		if (token.get()) {
			TVDML.navigate('main');
		} else {
			TVDML.navigate('auth', {
				onSuccess(ticket) {
					token.set(ticket.token, ticket.expires);
					TVDML.redirect('home');
				}
			});
		}
	});

TVDML
	.handleRoute('auth')
	.pipe(AuthRoute());

TVDML
	.handleRoute('main')
	.pipe(TVDML.render(
		<document>
			<menuBarTemplate>
				<menuBar>
					<menuItem autoHighlight="true" route="my">
						<title>My Series</title>
					</menuItem>
					<menuItem route="all">
						<title>All Series</title>
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
	.pipe(TVDML.render(<Loader title="Search" />));

TVDML
	.handleRoute('tvshow')
	.pipe(TVShowRoute());

TVDML
	.handleRoute('season')
	.pipe(SeasonRoute());

TVDML
	.handleRoute('actor')
	.pipe(ActorRoute());
