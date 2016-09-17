/** @jsx jsx */

import {jsx} from 'tvdml';

export default function Authorize({key, attrs = {}, events = {}}) {
	let {theme} = attrs;
	let {onAuthorize} = events;
	let styles;

	if (theme === 'dark') {
		styles = (
			<style content={`
				.grey_text {
					color: rgb(84, 82, 80);
				}

				.grey_description {
					color: rgb(132, 133, 135);
				}
			`} />
		);
	}

	return (
		<document>
			<head>
				{styles}
			</head>
			<alertTemplate>
				<title class="grey_text">
					Authorization
				</title>
				<description class="grey_description">
					You need to be authorized in order to see your subscriptions or watch content
				</description>
				<button onSelect={onAuthorize}>
					<text>Authorize</text>
				</button>
			</alertTemplate>
		</document>
	);
}
