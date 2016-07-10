/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
import * as token from './token';

import './routes/auth';

TVDML
	.handleRoute(TVDML.route.LAUNCH)
	.pipe((payload) => {
		if (token.get()) {
			TVDML.navigate('home');
		} else {
			TVDML.navigate('auth', {
				onSuccess(apiToken) {
					console.log(777, apiToken);
				},

				onFailure(error) {
					console.log(888, error);
				}
			});
		}
	});
