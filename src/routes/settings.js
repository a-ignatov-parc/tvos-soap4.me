/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

import * as token from '../token';
import * as settings from '../settings';

import {getStartParams} from '../utils';

const {VIDEO_QUALITY, TRANSLATION} = settings.params;
const {SD, HD, FULLHD} = settings.values[VIDEO_QUALITY];
const {ANY, RUSSIAN, SUBTITLES} = settings.values[TRANSLATION];

const titleMapping = {
	[VIDEO_QUALITY]: 'Video quality',
	[TRANSLATION]: 'Translation',
};

const descriptionMapping = {
	[VIDEO_QUALITY]: 'Prefered video quality that will be used if available.',
	[TRANSLATION]: 'To be able to use subtitles special option must be activated in account preferences on soap4.me site. Until this will be done only localized episodes will be shown.',
};

const valueMapping = {
	[SD]: 'SD',
	[HD]: 'HD',
	[FULLHD]: 'Full HD',
	[ANY]: 'Localization + Subtitles',
	[RUSSIAN]: 'Only Localization',
	[SUBTITLES]: 'Only Subtitles',
};

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				return settings.getAll();
			},

			render() {
				const {BASEURL} = getStartParams();

				let items = Object
					.keys(this.state)
					.map(key => ({
						key,
						value: this.state[key],
						title: getTitleForKey(key),
						description: getDescriptionForKey(key),
						result: getTitleForValue(this.state[key]),
					}));

				let relatedImage = (
					<img src={`${BASEURL}/assets/poster.png`} width="560" height="560"/>
				);

				return (
					<document>
						<listTemplate>
							<banner>
								<title style="color: rgb(142, 147, 157)">Settings</title>
							</banner>
							<list>
								<relatedContent>
									<lockup>
										{relatedImage}
									</lockup>
								</relatedContent>
								<section>
									{items.map(({key, value, title, description, result}) => (
										<listItemLockup
											key={key}
											onSelect={this.onChangeOption.bind(this, key, value)}
										>
											<title>
												{title}
											</title>
											<decorationLabel>
												{result}
											</decorationLabel>
											{description && (
												<relatedContent>
													<lockup>
														{relatedImage}
														<description style="margin: 80 0 0; color: rgb(84, 82, 80); text-align: center">
															{description}
														</description>
													</lockup>
												</relatedContent>
											)}
										</listItemLockup>
									))}
								</section>
								<section>
									<header>
										<title>Account</title>
									</header>
									<listItemLockup onSelect={this.onLogoutAttempt}>
										<title>Logout</title>
									</listItemLockup>
								</section>
							</list>
						</listTemplate>
					</document>
				);
			},

			onChangeOption(key, active) {
				let values = settings.values[key]
				let options = Object
					.keys(values)
					.map(key => values[key])
					.map(value => ({
						value,
						isActive: value === active,
						title: getTitleForValue(value),
					}));

				TVDML
					.renderModal(
						<document>
							<alertTemplate>
								<title>
									{getTitleForKey(key)}
								</title>
								{options.map(({title, value, isActive}) => (
									<button 
										key={value}
										onSelect={this.onOptionSelect.bind(this, key, value)}
										autoHighlight={isActive || undefined}
									>
										<text>{title}</text>
									</button>
								))}
							</alertTemplate>
						</document>
					)
					.sink();
			},

			onOptionSelect(key, value) {
				settings.set(key, value);
				this.setState(settings.getAll());
				TVDML.removeModal();
			},

			onLogoutAttempt() {
				TVDML
					.renderModal(
						<document>
							<alertTemplate>
								<title>
									Are you sure you want to log out?
								</title>
								<button
									onSelect={this.onLogout}
									style="tv-highlight-color: rgb(218, 61, 50)"
								>
									<text style="tv-highlight-color: rgb(255, 255, 255)">
										Logout
									</text>
								</button>
								<button onSelect={() => TVDML.removeModal()}>
									<text>Cancel</text>
								</button>
							</alertTemplate>
						</document>
					)
					.sink();
			},

			onLogout() {
				TVDML
					.render(<document />)
					.pipe(token.remove)
					.pipe(() => TVDML.navigate('start'))
					.sink();
			},
		})));
}

function getTitleForKey(key) {
	return titleMapping[key] || key;
}

function getDescriptionForKey(key) {
	return descriptionMapping[key];
}

function getTitleForValue(key) {
	return valueMapping[key] || key;
}
