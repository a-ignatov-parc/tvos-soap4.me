/** @jsx jsx */

import {jsx} from 'tvdml';
import {link} from '../utils';

export default function Tile({attrs = {}}) {
	let {
		route,
		title,
		poster,
		subtitle,
		payload = {},
	} = attrs;

	return (
		<lockup onSelect={link(route, payload)}>
			<img src={poster} width="250" height="250" />
			<title style="tv-labels-state: marquee-on-highlight">{title}</title>
			<subtitle>{subtitle}</subtitle>
		</lockup>
	);
}
