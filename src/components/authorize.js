/** @jsx jsx */

import {jsx} from 'tvdml';

import {get as i18n} from '../localization';

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
					{i18n('authorize-caption')}
				</title>
				<description class="grey_description">
					{i18n('authorize-description')}
				</description>
				<button onSelect={onAuthorize}>
					<text>
						{i18n('authorize-control-trigger')}
					</text>
				</button>
			</alertTemplate>
		</document>
	);
}
