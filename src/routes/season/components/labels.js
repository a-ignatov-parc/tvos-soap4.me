/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

import {quality} from '../../../quality';

const {SD, HD, FULLHD} = quality;

export default function Labels({attrs = {}}) {
	let {
		partial,
		quality,
		watched,
	} = attrs;

	return (
		<decorationLabel partial={partial} quality={quality}>
			{watched && (
				<badge src="resource://button-checkmark" />
			)}
			{'  '}
			{!!~[FULLHD, HD].indexOf(quality) && (
				<badge src="resource://hd" />
			)}
		</decorationLabel>
	);
}
