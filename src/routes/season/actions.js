/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

import {
	markEpisodeAsWatched,
	markEpisodeAsUnWatched,
} from '../../request/soap';

import Labels from './components/labels';
import Controls from './components/controls';

const actions = {
	add(eid, partials) {
		let labels = partials[`label-${eid}`];
		let controls = partials[`episode-${eid}`];
		let quality = labels.target.getAttribute('quality');

		labels.update(
			<Labels
				watched={true}
				quality={quality}
			/>
		);

		controls.update(
			<Controls
				scenario="watched"
			/>
		);

		return markEpisodeAsWatched(eid);
	},

	remove(eid, partials) {
		let labels = partials[`label-${eid}`];
		let controls = partials[`episode-${eid}`];
		let quality = labels.target.getAttribute('quality');

		labels.update(
			<Labels
				watched={false}
				quality={quality}
			/>
		);

		controls.update(
			<Controls
				scenario="not-watched"
			/>
		);

		return markEpisodeAsUnWatched(eid);
	},
};

export default function execAction(name, ...params) {
	return actions[name] && actions[name](...params);
}
