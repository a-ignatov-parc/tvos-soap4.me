/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
import assign from 'object-assign';

import * as token from '../token';
import {get} from '../request';

import Loader from '../components/loader';

const headers = {
	'User-Agent': 'xbmc for soap',
};

export default TVDML
	.createPipeline()
	.pipe(TVDML.render(<Loader title="Loading..." />))
	.pipe(() => {
		return get('https://soap4.me/api/soap/', assign({}, headers, {
			'X-Api-Token': token.get(),
		})).then((response) => {
			console.log(111, response);
		});
	});
