/** @jsx jsx */

import {jsx} from 'tvdml';
import {link} from '../utils';

export default function Tile({key, attrs = {}, events = {}}) {
	let {
		route,
		title,
		poster,
		counter,
		subtitle,
		isWatched,
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
			<img
				src={poster}
				width="250"
				height="250"
				style={`
					tv-placeholder: tv; 
					tv-tint-color: linear-gradient(top, 0.4, transparent, rgba(0, 0, 0, 0.5));
				`}
			/>
			<title style="tv-text-highlight-style: marquee-on-highlight">{title}</title>
			<subtitle>{subtitle}</subtitle>
			<overlay style="margin: 0; padding: 0;">
				{!isWatched && counter && (
					<textBadge
						type="fill"
						style={`
							font-size: 20;
							border-radius: 30;
							margin: 10;
							padding: 1 8;
							tv-align: right;
							tv-position: bottom;
							tv-tint-color: rgb(255, 255, 255);
						`}
					>{counter}</textBadge>
				)}
				{isWatched && (
					<badge
						style="tv-position: bottom-right;"
						src="resource://overlay-checkmark"
					/>
				)}
			</overlay>
		</lockup>
	);
}
