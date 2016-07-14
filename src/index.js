/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
import * as token from './token';

import Loader from './components/loader';

import HomeRoute from './routes/home';
import AuthRoute from './routes/auth';

TVDML
	.subscribe(TVDML.event.LAUNCH)
	.pipe(() => {
		if (token.get()) {
			TVDML.navigate('home');
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
	.handleRoute('home')
	.pipe(HomeRoute);

TVDML
	.handleRoute('auth')
	.pipe(AuthRoute);
