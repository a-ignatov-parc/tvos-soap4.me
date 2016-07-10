/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
import {log, link} from './utils';
import Loader from './components/loader';

const {Promise} = TVDML;

TVDML
	.handleRoute(TVDML.route.LAUNCH)
	.pipe(log('Route matched'))
	.pipe(TVDML.render(
		<document>
			<descriptiveAlertTemplate>
				<title>
					Title
				</title>
				<description>
					Lorem ipsum dolor sit amet, usu ad sint phaedrum. Sea eros graecis assueverit te. Est ad habeo aperiri eripuit. Scripta sanctus assueverit in mea, pro no nulla theophrastus. Viris explicari quo ea, dicam possit definiebas vix ut, eum pertinax hendrerit elaboraret te. Id usu legere putent, sint convenire vis te. Quo simul dolore primis an.
				</description>
				<row>
					<button onSelect={link('foo', {foo: 'bar'})}>
						<text>Go to "Foo" page</text>
					</button>
				</row>
			</descriptiveAlertTemplate>
		</document>
	));

TVDML
	.handleRoute('foo')
	.pipe(log('Route matched'))
	.pipe(TVDML.render(<Loader title="Waiting for something..." />))
	.pipe((payload) => new Promise((resolve) => {
		setTimeout(() => resolve(payload), 5000);
	}))
	.pipe(TVDML.render(({navigation, route}) => (
		<document>
			<descriptiveAlertTemplate>
				<title>
					Page "{route}"
				</title>
				<description>
					Params sent to page: {JSON.stringify(navigation)}
				</description>
			</descriptiveAlertTemplate>
		</document>
	)));
