/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

TVDML
	.handleRoute(TVDML.route.LAUNCH)
	.pipe(TVDML.render(
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
	.pipe(TVDML.pushDocument());
