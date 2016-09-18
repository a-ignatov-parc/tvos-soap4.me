/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

export function defaultErrorHandlers(error) {
	if (error.code === 'EBADCREDENTIALS') {
		this.reset().then(payload => TVDML.renderModal(
			<document>
				<alertTemplate>
					<title>Incorrect login or password</title>
					<button onSelect={TVDML.removeModal}>
						<text>Ok</text>
					</button>
				</alertTemplate>
			</document>
		)
		.sink(payload));
	}

	if (error.code === 'EBADRESPONSE') {
		this.reset().then(payload => TVDML.renderModal(
			<document>
				<alertTemplate>
					<title>Something went wrong =(</title>
					<button onSelect={TVDML.removeModal}>
						<text>Ok</text>
					</button>
				</alertTemplate>
			</document>
		)
		.sink(payload));
	}
}
