/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
import * as token from './token';

import './routes/auth';

TVDML
	.handleRoute(TVDML.route.LAUNCH)
	.pipe((payload) => {
		if (token.get()) {
			TVDML.redirect('home');
		} else {
			TVDML.redirect('auth', {
				onSuccess(apiToken) {
					console.log(777, apiToken);
				},

				onFailure(error) {
					console.log(888, error);
				}
			});
		}
	});

TVDML
	.handleRoute(TVDML.route.RESUME)
	.pipe(() => {
		if (!navigationDocument.documents.length) {
			TVDML.redirect(TVDML.route.LAUNCH);
		}
	});

TVDML
	.handleRoute(TVDML.route.SUSPEND)
	.pipe(() => {
		let document = getActiveDocument();

		if (document && document.route === 'auth') {
			navigationDocument.removeDocument(document);
		}
	});
