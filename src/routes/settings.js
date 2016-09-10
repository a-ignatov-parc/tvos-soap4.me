/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

import * as settings from '../settings';

import * as user from '../user';
import authFactory from '../helpers/auth';
import {defaultErrorHandlers} from '../helpers/auth/handlers';

import {logout} from '../request/soap';
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
				let authorized = user.isAuthorized();

				return {
					authorized,
					settings: settings.getAll(),
				};
			},

			componentDidMount() {
				this.userStateChangePipeline = user
					.subscription()
					.pipe(() => {
						this.setState({authorized: user.isAuthorized()});
					});

				this.authHelper = authFactory({
					onError: defaultErrorHandlers,
					onSuccess({token, till}, login) {
						user.set({token, till, login, logged: 1});
						this.dismiss();
					},
				});
			},

			componentWillUnmount() {
				this.userStateChangePipeline.unsubscribe();
				this.authHelper.destroy();
				this.authHelper = null;
			},

			render() {
				const {BASEURL} = getStartParams();

				let items = Object
					.keys(this.state.settings)
					.map(key => ({
						key,
						value: this.state.settings[key],
						title: getTitleForKey(key),
						description: getDescriptionForKey(key),
						result: getTitleForValue(this.state.settings[key]),
					}));

				let relatedImage = (
					<img src={`${BASEURL}/assets/poster.png`} width="560" height="560"/>
				);

				return (
					<document>
						<head>
							<style content={`
								.grey_title {
									color: rgb(142, 147, 157);
								}

								.grey_text {
									color: rgb(84, 82, 80);
								}

								.item_description {
									margin: 80 0 0; 
									text-align: center;
								}
							`} />
						</head>
						<listTemplate>
							<banner>
								<title class="grey_title">Settings</title>
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
														<description class="grey_text item_description">
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
									{this.state.authorized ? (
										<listItemLockup onSelect={this.onLogoutAttempt}>
											<title>Logout</title>
											<decorationLabel>
												{user.getLogin()}
											</decorationLabel>
										</listItemLockup>
									) : (
										<listItemLockup onSelect={this.onLogin}>
											<title>Login</title>
										</listItemLockup>
									)}
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
				this.setState({settings: settings.getAll()});
				TVDML.removeModal();
			},

			onLogin() {
				this.authHelper.present();
			},

			onLogout() {
				logout()
					.then(user.clear)
					.then(() => TVDML.removeModal());
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