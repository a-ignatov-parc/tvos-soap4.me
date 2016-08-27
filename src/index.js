/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
import * as token from './token';

import MyRoute from './routes/my';
import AllRoute from './routes/all';
import AuthRoute from './routes/auth';
import ActorRoute from './routes/actor';
import SeasonRoute from './routes/season';
import TVShowRoute from './routes/tvshow';
import SearchRoute from './routes/search';

TVDML
	.subscribe(TVDML.event.LAUNCH)
	.pipe(() => {
		if (token.get()) {
			TVDML.navigate('main');
		} else {
			TVDML.navigate('auth', {
				onSuccess(ticket) {
					token.set(ticket.token, ticket.expires);
					TVDML.navigate('main');
				}
			});
		}
	});

TVDML
	.handleRoute('auth')
	.pipe(AuthRoute());

TVDML
	.handleRoute('main')
	.pipe(TVDML.passthrough(({document: currentDocument}) => {
		navigationDocument.documents
			.filter((document, i, list) => i < list.indexOf(currentDocument))
			.forEach(document => navigationDocument.removeDocument(document));
	}))
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
	.handleRoute('tvshow')
	.pipe(TVShowRoute());

TVDML
	.handleRoute('season')
	.pipe(SeasonRoute());

TVDML
	.handleRoute('actor')
	.pipe(ActorRoute());
