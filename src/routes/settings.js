/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

import * as settings from '../settings';
import * as localization from '../localization';

import {link} from '../utils';
import * as user from '../user';
import authFactory from '../helpers/auth';
import {deepEqualShouldUpdate} from '../utils/components';
import {defaultErrorHandlers} from '../helpers/auth/handlers';

import {logout, version, checkSession} from '../request/soap';
import {getStartParams} from '../utils';

const {get: i18n} = localization;

const {
	VIDEO_QUALITY,
	TRANSLATION,
	VIDEO_PLAYBACK,
	LANGUAGE,
} = settings.params;

const {SD, HD, FULLHD} = settings.values[VIDEO_QUALITY];
const {LOCALIZATION, SUBTITLES} = settings.values[TRANSLATION];
const {CONTINUES, BY_EPISODE} = settings.values[VIDEO_PLAYBACK];
const {AUTO, EN, RU} = settings.values[LANGUAGE];

const titleMapping = {
	[VIDEO_QUALITY]: 'settings-labels-video_quality',
	[TRANSLATION]: 'settings-labels-translation',
	[VIDEO_PLAYBACK]: 'settings-labels-video_playback',
	[LANGUAGE]: 'settings-labels-language',
};

const descriptionMapping = {
	[VIDEO_QUALITY]: 'settings-descriptions-video_quality',
	[TRANSLATION]: 'settings-descriptions-translation',
	[VIDEO_PLAYBACK]: 'settings-descriptions-video_playback',
};

const valueMapping = {
	[SD]: 'settings-values-sd',
	[HD]: 'settings-values-hd',
	[FULLHD]: 'settings-values-fhd',
	[SUBTITLES]: 'settings-values-subtitles',
	[LOCALIZATION]: 'settings-values-localization',
	[CONTINUES]: 'settings-values-continues',
	[BY_EPISODE]: 'settings-values-by_episode',
	[AUTO]: 'settings-values-auto',
	[EN]: 'settings-values-en',
	[RU]: 'settings-values-ru',
};

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				let authorized = user.isAuthorized();
				let language = localization.getLanguage();

				return {
					language,
					authorized,
					settings: settings.getAll(),
				};
			},

			componentDidMount() {
				this.userStateChangeStream = user.subscription();
				this.userStateChangeStream.pipe(() => {
					this.setState({authorized: user.isAuthorized()});
				});

				this.languageChangeStream = localization.subscription();
				this.languageChangeStream.pipe(({language}) => {
					this.createAuthHelper();
					this.setState({language});
				});

				this.createAuthHelper();
			},

			createAuthHelper() {
				if (this.authHelper) {
					this.authHelper.destroy();
					this.authHelper = null;
				}

				this.authHelper = authFactory({
					onError: defaultErrorHandlers,
					onSuccess({token, till}) {
						user.set({token, till, logged: 1});
						this.dismiss();
					},
				});
			},

			componentWillUnmount() {
				this.userStateChangeStream.unsubscribe();
				this.languageChangeStream.unsubscribe();
				this.authHelper.destroy();
				this.authHelper = null;
			},

			shouldComponentUpdate: deepEqualShouldUpdate,

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

								.item {
									background-color: rgba(255, 255, 255, 0.3);
									tv-highlight-color: rgba(255, 255, 255, 0.9);
								}

								@media tv-template and (tv-theme:dark) {
									.item {
										background-color: rgba(255, 255, 255, 0.05);
									}
								}

								.item_description {
									margin: 80 0 0; 
									text-align: center;
								}
							`} />
						</head>
						<listTemplate>
							<banner>
								<title class="grey_title">
									{i18n('settings-caption')}
								</title>
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
											class="item"
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
										<title>
											{i18n('settings-titles-account')}
										</title>
									</header>
									{this.state.authorized ? (
										<listItemLockup
											class="item"
											onSelect={this.onLogoutAttempt}
										>
											<title>
												{i18n('settings-labels-logout')}
											</title>
											<decorationLabel>
												{user.getLogin()}
											</decorationLabel>
										</listItemLockup>
									) : (
										<listItemLockup
											class="item"
											onSelect={this.onLogin}
										>
											<title>
												{i18n('settings-labels-login')}
											</title>
										</listItemLockup>
									)}
								</section>
								{this.state.authorized && (
									<section>
										<header>
											<title>
												{i18n('settings-titles-network')}
											</title>
										</header>
										<listItemLockup
											class="item"
											onSelect={link('speedtest')}
										>
											<title>
												{i18n('settings-labels-speedtest')}
											</title>
										</listItemLockup>
									</section>
								)}
								<section>
									<header>
										<title>
											{i18n('settings-titles-about')}
										</title>
									</header>
									<listItemLockup disabled="true">
										<title>
											{i18n('settings-labels-version')}
										</title>
										<decorationLabel>{version}</decorationLabel>
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
				this.setState({settings: settings.getAll()});
				TVDML.removeModal();
			},

			onLogin() {
				this.authHelper.present();
			},

			onLogout() {
				logout()
					.then(user.clear)
					.then(checkSession)
					.then(({logged, token, till}) => user.set({logged, token, till}))
					.then(() => TVDML.removeModal());
			},

			onLogoutAttempt() {
				TVDML
					.renderModal(
						<document>
							<alertTemplate>
								<title>
									{i18n('settings-logout-caption')}
								</title>
								<button onSelect={this.onLogout}>
									<text>
										{i18n('settings-logout-logout_btn')}
									</text>
								</button>
								<button onSelect={() => TVDML.removeModal()}>
									<text>
										{i18n('settings-logout-cancel_btn')}
									</text>
								</button>
							</alertTemplate>
						</document>
					)
					.sink();
			},
		})));
}

function getTitleForKey(key) {
	return i18n(titleMapping[key] || key);
}

function getDescriptionForKey(key) {
	return i18n(descriptionMapping[key]);
}

function getTitleForValue(key) {
	return i18n(valueMapping[key] || key);
}
