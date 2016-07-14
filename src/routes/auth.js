/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

import {getStartParams} from '../utils';
import {post} from '../request';

import Loader from '../components/loader';

const headers = {
	'User-Agent': 'xbmc for soap',
};

export default TVDML
	.createPipeline()
	.pipe((payload) => {
		let {onSuccess, error} = payload.navigation || {};
		let {route} = payload;

		let loginDocument;
		let passwordDocument;

		gatherInfo('Enter login', false, (login) => {
			TVDML
				.render(<document />)
				.pipe(gatherInfo('Enter password', true, (password) => {
					TVDML
						.render(<Loader title="Authorizing..." />)
						.pipe(() => {
							navigationDocument.removeDocument(loginDocument);
							navigationDocument.removeDocument(passwordDocument);

							post('https://soap4.me/login/', {login, password}, headers)
								.then(response => {
									if (response.ok) {
										onSuccess({
											token: response.token,
											expires: response.till,
										});
									} else {
										TVDML.redirect(route, {
											error: 'Incorrect login or password',
											onSuccess,
										});
									}
								})
								.catch(error => {
									console.error(error);

									TVDML.redirect(route, {
										error: 'Something went wrong =(',
										onSuccess,
									});
								});
						})
						.sink({route});
				}))
				.pipe(({document}) => passwordDocument = document)
				.sink({route});
		})
		.pipe(({document}) => loginDocument = document)
		.pipe(() => {
			if (error) {
				TVDML.renderModal(
					<document>
						<alertTemplate>
							<title>{error}</title>
							<button onSelect={TVDML.removeModal}>
								<text>Ok</text>
							</button>
						</alertTemplate>
					</document>
				)
				.sink({route});
			}
		})
		.sink({route})
	});

function gatherInfo(description, secure, callback) {
	const {BASEURL} = getStartParams();

	return TVDML.render(
		<document>
			<formTemplate>
				<banner>
					<img src={`${BASEURL}/assets/logo.png`} width="218" height="218"/>
					<description>
						{description}
					</description>
				</banner>
				<textField secure={secure} />
				<footer>
					<button onSelect={onSubmit(callback)}>
						<text>Submit</text>
					</button>
				</footer>
			</formTemplate>
		</document>
	);
}

function onSubmit(resolve) {
	return (event) => {
		let document = event.target.ownerDocument;
		let input = document.getElementsByTagName('textField').item(0);

		resolve(input.getFeature('Keyboard').text);
	}
}
