/** @jsx TVDML.jsx */

import TVDML from 'tvdml';

TVDML
	.handleRoute(TVDML.route.LAUNCH)
	.then(TVDML.render(
		<document>
			<alertTemplate>
				<title>
					Test pop
				</title>
				<description>
					Description
				</description>
				<button>
					<text>Go to Next Page</text>
				</button>
				<button>
					<text>Close</text>
				</button>
			</alertTemplate>
		</document>
	))
	.then(TVDML.pushDocument());
