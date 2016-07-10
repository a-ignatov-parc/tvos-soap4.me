/** @jsx jsx */

import {jsx} from 'tvdml';

export default function Loader({attrs: {title}}) {
	return (
		<document>
			<loadingTemplate>
				<activityIndicator>
					<title>
						{title || 'Loading'}
					</title>
				</activityIndicator>
			</loadingTemplate>
		</document>
	);
}
