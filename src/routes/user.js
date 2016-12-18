/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

import * as user from '../user';
import {get as i18n} from '../localization';
import {deepEqualShouldUpdate} from '../utils/components';
import {
	logout,
	addAccount,
	selectAccount,
	renameAccount,
	deleteAccount,
	checkSession,
	getFamilyAccounts,
	turnOffFamilyAccount,
	migrateToFamilyAccount,
} from '../request/soap';

import Loader from '../components/loader';

const ADD_ACCOUNT = 'add_account';
const TURN_ON_FAMILY_ACCOUNT = 'turn_on_family_account';
const TURN_OFF_FAMILY_ACCOUNT = 'turn_off_family_account';

const nameRegex = /^[a-zа-я0-9_ ]{1,50}$/i;

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				return this.getStateData();
			},

			getStateData() {
				const authorized = user.isAuthorized();
				const {family, selected} = user.get();
				const isFamilyAccount = user.isFamily();
				const mainAccount = user.getMainAccount();

				return {
					family,
					authorized,
					isFamilyAccount,
					selected : selected || mainAccount,
				};
			},

			shouldComponentUpdate: deepEqualShouldUpdate,

			render() {
				const {
					family,
					selected,
					authorized,
					isFamilyAccount,
				} = this.state;

				console.log(888, this.state);

				const currentFid = `${selected.fid}`;

				const accountsList = isFamilyAccount
					? family.concat({
						firstName: '+',
						action: ADD_ACCOUNT,
						name: 'Add new account',
					})
					: [selected];

				// Исправление рендеринга списка аккаунтов.
				// Если изменять количество элементов в `shelf` и не тригерить пересчет стилей 
				// на самом `shelf`, то будут артефакты позиционирования. Для того чтоб это 
				// исправить изменяем значение боковых отсутпов для того чтоб TVMLKit запустил 
				// пересчет геометрии.
				const shelfStyles = `tv-interitem-spacing: 100; margin: 247 ${accountsList.length} 0`;

				return (
					<document>
						<stackTemplate>
							<banner>
								<title>
									Accounts
								</title>
							</banner>
							<collectionList>
								<shelf centered="true" style={shelfStyles}>
									<section>
										{accountsList.map(account => {
											const {fid, name, firstName, disabled} = account;
											const isActive = currentFid === fid;

											return (
												<monogramLockup
													disabled={disabled}
													onSelect={this.onActivate.bind(this, account)}
													onHoldselect={this.onAction.bind(this, account)}
												>
													<monogram
														style="tv-placeholder: monogram"
														firstName={firstName || name}
													/>
													<title>{name}</title>
													{isActive && (
														<subtitle>
															Active
														</subtitle>
													)}
												</monogramLockup>
											);
										})}
									</section>
								</shelf>
								<row style="tv-align: center">
									{isFamilyAccount ? (
										<button onSelect={this.onTurnOffFamilyAccountAttempt}>
											<text>
												Turn Off Family Account
											</text>
										</button>
									) : (
										<button onSelect={this.onTurnOnFamilyAccountAttempt}>
											<text>
												Turn On Family Account
											</text>
										</button>
									)}
									
								</row>
								<row style="tv-align: center; margin: 80 0 0">
									<button onSelect={this.onLogoutAttempt}>
										<text>
											Logout
										</text>
									</button>
								</row>
							</collectionList>
						</stackTemplate>
					</document>
				);
			},

			onTurnOnFamilyAccount() {
				return migrateToFamilyAccount().then(this.fetchAccountUpdate.bind(this));
			},

			onTurnOffFamilyAccount() {
				return turnOffFamilyAccount().then(this.fetchAccountUpdate.bind(this));
			},

			onTurnOnFamilyAccountAttempt() {
				this.onSwitchFamilyAccountStateAttempt(TURN_ON_FAMILY_ACCOUNT);
			},

			onTurnOffFamilyAccountAttempt() {
				this.onSwitchFamilyAccountStateAttempt(TURN_OFF_FAMILY_ACCOUNT);
			},

			onSwitchFamilyAccountStateAttempt(state) {
				TVDML
					.renderModal(
						<document>
							<alertTemplate>
								{state === TURN_ON_FAMILY_ACCOUNT && (
									<title>
										Are you sure you want to turn on Family Accounts?
									</title>
								)}
								{state === TURN_OFF_FAMILY_ACCOUNT && (
									<title>
										Are you sure you want to turn off Family Accounts?
									</title>
								)}
								{state === TURN_ON_FAMILY_ACCOUNT && (
									<button onSelect={() => {
										this
											.onTurnOnFamilyAccount()
											.then(TVDML.removeModal);
									}}>
										<text>
											Turn On
										</text>
									</button>
								)}
								{state === TURN_OFF_FAMILY_ACCOUNT && (
									<button onSelect={() => {
										this
											.onTurnOffFamilyAccount()
											.then(TVDML.removeModal);
									}}>
										<text>
											Turn Off
										</text>
									</button>
								)}
								<button onSelect={() => TVDML.removeModal()}>
									<text>
										Cancel
									</text>
								</button>
							</alertTemplate>
						</document>
					)
					.sink();
			},

			onLogout() {
				logout()
					.then(user.clear)
					.then(checkSession)
					.then(({logged, token, till}) => user.set({logged, token, till}))
					.then(getFamilyAccounts)
					.then(({family, selected}) => {
						user.set({family, selected});
						this.setState(this.getStateData());
					})
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

			onActivate(account) {
				if (this.state.selected === account) return;

				if (account.action === ADD_ACCOUNT) {
					return this.showUserRenamePopover({
						title: 'Account creation',
						description: 'Enter name for new account.',
						button: 'Add',
						submit: value => {
							this
								.addAccount(value)
								.then(TVDML.removeModal);
						},
					});
				}

				this.selectAccount(account.fid);
			},

			onAction(account) {
				const isActive = this.state.selected === account;

				TVDML
					.renderModal(
						<document>
							<alertTemplate>
								<title>
									What you want to do with "{account.name}"?
								</title>
								{!isActive && (
									<button onSelect={() => {
										this
											.selectAccount(account.fid)
											.then(TVDML.removeModal);
									}}>
										<text>Set as Active</text>
									</button>
								)}
								<button onSelect={() => {
									this.showUserRenamePopover({
										title: `Rename account "${account.name}"`,
										description: 'Enter new name for the account.',
										button: 'Update',
										submit: value => {
											this
												.renameAccount(account.fid, value)
												.then(TVDML.removeModal);
										},
									});
								}}>
									<text>Rename</text>
								</button>
								{!isActive && (
									<button onSelect={() => {
										this
											.deleteAccount(account.fid)
											.then(TVDML.removeModal);
									}}>
										<text>Delete</text>
									</button>
								)}
							</alertTemplate>
						</document>
					)
					.sink();
			},

			showUserRenamePopover(params = {}) {
				TVDML
					.renderModal(TVDML.createComponent({
						getInitialState() {
							return {
								value: '',
								valid: false,
								loading: false,
							};
						},

						componentDidMount() {
							const keyboard = this.textField.getFeature('Keyboard');
							keyboard.onTextChange = () => this.validate(keyboard.text);
						},

						validate(value) {
							this.setState({value, valid: nameRegex.test(value)});
						},

						render() {
							if (this.state.loading) {
								return <Loader />;
							}

							return (
								<document>
									<formTemplate>
										<banner>
											<title>
												{params.title}
											</title>
											<description>
												{params.description}
											</description>
										</banner>
										<textField ref={node => this.textField = node} />
										<footer>
											<button
												onSelect={this.onSubmit}
												disabled={!this.state.valid}
											>
												<text>
													{params.button}
												</text>
											</button>
										</footer>
									</formTemplate>
								</document>
							);
						},

						onSubmit() {
							this.setState({loading: true});

							if (typeof(params.submit) === 'function') {
								params.submit(this.state.value);
							}
						},
					}))
					.sink();
			},

			selectAccount(fid) {
				return selectAccount(fid).then(this.fetchAccountUpdate.bind(this));
			},

			addAccount(name) {
				return addAccount(name).then(this.fetchAccountUpdate.bind(this));
			},

			renameAccount(fid, name) {
				return renameAccount(fid, name).then(this.fetchAccountUpdate.bind(this));
			},

			deleteAccount(fid) {
				return deleteAccount(fid).then(this.fetchAccountUpdate.bind(this));
			},

			fetchAccountUpdate() {
				return getFamilyAccounts().then(({family, selected}) => {
					user.set({family, selected});
					this.setState(this.getStateData());
				});
			},
		})));
}
