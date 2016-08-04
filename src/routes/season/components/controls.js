/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

export default function Controls({attrs = {}}) {
	let {
		partial,
		scenario = 'not-watched',
	} = attrs;

	let scenarios = {
		'watched': [
			{
				id: 'remove',
				title: 'Mark as New',
				badge: 'resource://button-remove',
			},
		],
		'not-watched': [
			{
				id: 'add',
				title: 'Mark as Watched',
				badge: 'resource://button-add',
			},
		],
	};

	return (
		<row partial={partial}>
			{scenarios[scenario].map(({id, title, badge}) => (
				<buttonLockup id={id}>
					<badge src={badge} />
					<title>{title}</title>
				</buttonLockup>
			))}
		</row>
	);
}
