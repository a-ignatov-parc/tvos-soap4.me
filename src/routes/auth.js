/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
import assign from 'object-assign';

import {getStartParams} from '../utils';

import Loader from '../components/loader';

const {Promise} = TVDML;

TVDML
	.handleRoute('auth')
	.pipe((payload) => {
		let {onSuccess, onFailure} = payload.navigation || {};

		let login;
		let password;
		let loginPromise = new Promise((resolve) => login = resolve);
		let passwordPromise = new Promise((resolve) => password = resolve);

		Promise
			.all([loginPromise, passwordPromise])
			.then(([login, password]) => {
				console.log(666, {login, password});
			});

		return assign({}, payload, {
			credentials: {
				login, 
				password,
				loginPromise,
				passwordPromise,
			}
		});
	})
	.pipe(TVDML.renderModal(({credentials: {login}}) => {
		const {BASEURL} = getStartParams();

		return (
			<document>
				<formTemplate>
					<banner>
						<img src={`${BASEURL}/assets/logo.png`} width="218" height="218"/>
						<description>
							Enter login
						</description>
					</banner>
					<textField />
					<footer>
						<button onSelect={onSubmit(login)}>
							<text>Submit</text>
						</button>
					</footer>
				</formTemplate>
			</document>
		);
	}))
	.pipe(payload => {
		let {credentials: {loginPromise}} = payload;
		return loginPromise.then(() => payload);
	})
	.pipe(TVDML.renderModal(({credentials: {password}}) => {
		const {BASEURL} = getStartParams();

		return (
			<document>
				<formTemplate>
					<banner>
						<img src={`${BASEURL}/assets/logo.png`} width="218" height="218"/>
						<description>
							Enter password
						</description>
					</banner>
					<textField secure="true" />
					<footer>
						<button onSelect={onSubmit(password)}>
							<text>Submit</text>
						</button>
					</footer>
				</formTemplate>
			</document>
		);
	}))
	.pipe(payload => {
		let {credentials: {passwordPromise}} = payload;
		return passwordPromise.then(() => payload);
	})
	.pipe(TVDML.render(<Loader title="Authorizing..." />));

function onSubmit(resolve) {
	return (event) => {
		let document = event.target.ownerDocument;
		let input = document.getElementsByTagName('textField').item(0);

		resolve(input.getFeature('Keyboard').text);
	}
}
