/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

TVDML
	.handleRoute(TVDML.route.LAUNCH)
	.pipe(log('Route matched'))
	.pipe(TVDML.render(({navigation: {BASEURL: url}}) => (
		<document>
			<alertTemplate>
				<title>
					Demo application
				</title>
				<description>
					Launched on "{url}"
				</description>
				<button>
					<text>Go to Next Page</text>
				</button>
				<text>
					For testing purposes
				</text>
			</alertTemplate>
		</document>
	)))
	.pipe(log('Document rendered'))
	.pipe((payload) => {
		for (let i = 0; i < payload.document.childNodes.length; i++) {
			console.log(payload.document.childNodes.item(i).outerHTML);
		}
		return payload;
	})
	.pipe(TVDML.pushDocument)
	.pipe(log('Document pushed to navigation'))

function log(message = '') {
	return (payload) => {
		console.log(message, payload);
		return payload;
	}
}
