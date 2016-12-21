/** @jsx jsx */

import {jsx} from 'tvdml';

import {get as i18n} from '../localization';
import commonStyles from '../common/styles';

export default function Authorize({key, attrs = {}, events = {}}) {
	const {theme} = attrs;
	const {onAuthorize} = events;
	const styles = theme === 'dark' ? commonStyles : undefined;

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
