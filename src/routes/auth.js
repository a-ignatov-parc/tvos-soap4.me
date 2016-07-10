/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
import assign from 'object-assign';

import {getStartParams} from '../utils';
import {get, post} from '../request';
import * as token from '../token';

import Loader from '../components/loader';

const {Promise} = TVDML;

TVDML
	.handleRoute('auth')
	.pipe(TVDML.passthrough((payload) => {
		let {onSuccess, onFailure} = payload.navigation || {};

		let login;
		let password;
		let loginPromise = new Promise((resolve) => login = resolve);
		let passwordPromise = new Promise((resolve) => password = resolve);

		return {
			credentials: {
				login, 
				password,
				loginPromise,
				passwordPromise,
			},

			callbacks: {
				onSuccess,
				onFailure,
			},
		};
	}))
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
	.pipe(TVDML.passthrough(({credentials: {loginPromise}}) => loginPromise))
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
	.pipe(TVDML.passthrough(({credentials: {passwordPromise}}) => passwordPromise))
	.pipe(TVDML.render(<Loader title="Authorizing..." />))
	.pipe(({credentials, callbacks}) => {
		let {loginPromise, passwordPromise} = credentials;
		let {onSuccess, onFailure} = callbacks;

		Promise
			.all([loginPromise, passwordPromise])
			.then(([login, password]) => post('https://soap4.me/login/', {
				login,
				password,
			}, (XHR) => {
				XHR.setRequestHeader('User-Agent', 'xbmc for soap');
				return XHR;
			}))
			.then((response) => {
				console.log(777, response.status, response.responseText);
			})
			.catch((error) => {
				console.error(888, error);
			})
	})

function onSubmit(resolve) {
	return (event) => {
		let document = event.target.ownerDocument;
		let input = document.getElementsByTagName('textField').item(0);

		resolve(input.getFeature('Keyboard').text);
	}
}
