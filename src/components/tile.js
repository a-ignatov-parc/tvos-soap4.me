/** @jsx jsx */

import {jsx} from 'tvdml';
import {link} from '../utils';

export default function Tile({attrs = {}, key}) {
	let {
		route,
		title,
		poster,
		subtitle,
		payload = {},
		autoHighlight
	} = attrs;

	return (
		<lockup
			key={key}
			onSelect={link(route, payload)}
			autoHighlight={autoHighlight ? 'true' : undefined}
		>
			<img src={poster} width="250" height="250" />
			<title style="tv-text-highlight-style: marquee-on-highlight">{title}</title>
			<subtitle>{subtitle}</subtitle>
		</lockup>
	);
}
