/** @jsx jsx */

import {jsx} from 'tvdml';

export default function Loader({attrs = {}}) {
	let {title} = attrs;

	return (
		<document>
			<loadingTemplate>
				<activityIndicator>
					<title>{title}</title>
				</activityIndicator>
			</loadingTemplate>
		</document>
	);
}
