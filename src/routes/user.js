/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

import * as user from '../user';
import {get as i18n} from '../localization';
import {deepEqualShouldUpdate} from '../utils/components';
import {
	addAccount,
	selectAccount,
	renameAccount,
	deleteAccount,
	getFamilyAccounts,
} from '../request/soap';

import Loader from '../components/loader';

const ADD_ACCOUNT = 'add_account';

const nameRegex = /^[a-zа-я0-9_ ]{1,50}$/i;

export default function() {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				const authorized = user.isAuthorized();
				const {family, selected} = user.get();

				return {
					family,
					selected,
					authorized,
				};
			},

			shouldComponentUpdate: deepEqualShouldUpdate,

			render() {
				const {
					family,
					selected,
					authorized,
				} = this.state;

				const currentFid = `${selected.fid}`;

				const accountsList = [...Array(3)].map((item, i) => {
					if (family[i]) return family[i];
					return {
						firstName: '+',
						action: ADD_ACCOUNT,
						name: 'Add new account',
						disabled: i !== family.length,
					};
				});

				return (
					<document>
						<stackTemplate>
							<banner>
								<title>
									Accounts
								</title>
							</banner>
							<collectionList>
								<shelf centered="true" style="tv-interitem-spacing: 100; margin: 247 0 0">
									<section>
										{accountsList.map(account => {
											const {fid, name, firstName, disabled} = account;
											const isActive = currentFid === fid;

											return (
												<monogramLockup
													disabled={isActive || disabled}
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
									<button>
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

			onActivate(account) {
				if (account.action === ADD_ACCOUNT) {
					return this.addAccount();
				}

				this.selectAccount(account.fid);
			},

			onAction(account) {
				TVDML
					.renderModal(
						<document>
							<alertTemplate>
								<title>
									{account.name}
								</title>
								<button onSelect={() => {
									this.deleteAccount(account.fid);
									TVDML.removeModal();
								}}>
									<text>Delete</text>
								</button>
							</alertTemplate>
						</document>
					)
					.sink();
			},

			addAccount() {
				const setState = this.setState.bind(this);

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
												Account creation
											</title>
											<description>
												Enter name for new account.
											</description>
										</banner>
										<textField ref={node => this.textField = node} />
										<footer>
											<button
												onSelect={this.onSubmit}
												disabled={!this.state.valid}
											>
												<text>Add</text>
											</button>
										</footer>
									</formTemplate>
								</document>
							);
						},

						onSubmit() {
							this.setState({loading: true})
							addAccount(this.state.value)
								.then(getFamilyAccounts)
								.then(({family, selected}) => {
									user.set({family, selected});
									setState({family, selected});
									TVDML.removeModal();
								});
						},
					}))
					.sink();
			},

			selectAccount(fid) {
				return selectAccount(fid)
					.then(getFamilyAccounts)
					.then(({family, selected}) => {
						user.set({family, selected});
						this.setState({family, selected});
					});
			},

			renameAccount(fid) {
				console.log('renameAccount', fid);
			},

			deleteAccount(fid) {
				return deleteAccount(fid)
					.then(getFamilyAccounts)
					.then(({family, selected}) => {
						user.set({family, selected});
						this.setState({family, selected});
					});
			},
		})));
}
