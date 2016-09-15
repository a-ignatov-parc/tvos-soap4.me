/** @jsx jsx */

import {jsx} from 'tvdml';
import {link} from '../utils';

export default function Tile({key, attrs = {}, events = {}}) {
	let {
		route,
		title,
		poster,
		subtitle,
		payload = {},
		autoHighlight,
	} = attrs;

	let {
		onPlay,
		onSelect,
		onHighlight,
		onHoldselect,
	} = events;

	return (
		<lockup
			key={key}
			onPlay={onPlay}
			onSelect={onSelect || link(route, payload)}
			onHighlight={onHighlight}
			onHoldselect={onHoldselect}
			autoHighlight={autoHighlight ? 'true' : undefined}
		>
			<img src={poster} style="tv-placeholder: tv" width="250" height="250" />
			<title style="tv-text-highlight-style: marquee-on-highlight">{title}</title>
			<subtitle>{subtitle}</subtitle>
		</lockup>
	);
}
