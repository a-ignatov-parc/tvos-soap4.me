import moment from 'moment';
import * as TVDML from 'tvdml';

import * as user from '../user';

import { promisedTimeout } from '../utils';
import { deepEqualShouldUpdate } from '../utils/components';

import authFactory from '../helpers/auth';
import { defaultErrorHandlers } from '../helpers/auth/handlers';

import { get as i18n } from '../localization';

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
import Authorize from '../components/authorize';

const ADD_ACCOUNT = 'add_account';
const TURN_ON_FAMILY_ACCOUNT = 'turn_on_family_account';
const TURN_OFF_FAMILY_ACCOUNT = 'turn_off_family_account';

const RENDERING_DELAY = 500;

const nameRegex = /^[a-zа-я0-9_ ]{1,50}$/i;

export default function userRoute() {
  return TVDML.createPipeline().pipe(
    TVDML.render(
      TVDML.createComponent({
        getInitialState() {
          return this.getUserState();
        },

        getUserState() {
          const extended = user.isExtended();
          const authorized = user.isAuthorized();
          const { family, selected } = user.get();
          const isFamilyAccount = user.isFamily();
          const mainAccount = user.getMainAccount();

          return {
            family,
            extended,
            authorized,
            isFamilyAccount,
            selected: selected || mainAccount,
          };
        },

        shouldComponentUpdate: deepEqualShouldUpdate,

        componentDidMount() {
          this.authHelper = authFactory({
            onError: defaultErrorHandlers,

            // eslint-disable-next-line consistent-return
            onSuccess: ({ token, till, login }) => {
              const dismiss = this.authHelper.dismiss.bind(this.authHelper);

              user.set({ token, till, logged: 1 });

              if (!user.isExtended()) {
                user.set({ family: [{ name: login, fid: 0 }], selected: null });
                this.setState(this.getUserState());
                return promisedTimeout(RENDERING_DELAY).then(dismiss);
              }

              this.fetchAccountUpdate()
                .then(promisedTimeout(RENDERING_DELAY))
                .then(dismiss);
            },
          });
        },

        componentWillUnmount() {
          this.authHelper.destroy();
          this.authHelper = null;
        },

        render() {
          const {
            family,
            selected,
            extended,
            authorized,
            isFamilyAccount,
          } = this.state;

          if (!authorized) {
            return (
              <Authorize
                description={i18n('authorize-user-description')}
                onAuthorize={this.onLogin}
              />
            );
          }

          const currentFid = `${selected.fid}`;

          const accountsList = isFamilyAccount
            ? family.concat({
                firstName: '+',
                action: ADD_ACCOUNT,
                name: i18n('user-add-account-button'),
              })
            : [selected];

          /**
           * Исправление рендеринга списка аккаунтов.
           * Если изменять количество элементов в `shelf` и не тригерить пересчет
           * стилей на самом `shelf`, то будут артефакты позиционирования.
           * Для того чтоб это исправить изменяем значение боковых отсутпов
           * для того чтоб TVMLKit запустил пересчет геометрии.
           */
          const shelfStyles = `
          tv-interitem-spacing: 100;
          margin: 247 ${accountsList.length} 0;
        `;

          const timestamp = +user.get().till;
          const date = moment.unix(timestamp);
          const till = date.fromNow();
          const accountInfo = extended
            ? i18n('user-description', { till })
            : ' ';

          return (
            <document>
              <stackTemplate>
                <banner>
                  <title>{i18n('user-caption')}</title>
                  <description style="margin: 35 0 -70">
                    {accountInfo}
                  </description>
                </banner>
                <collectionList>
                  <shelf centered="true" style={shelfStyles}>
                    <section>
                      {accountsList.map(account => {
                        const { fid, name, firstName } = account;
                        const isActive = currentFid === fid;

                        return (
                          <monogramLockup
                            // eslint-disable-next-line react/jsx-no-bind
                            onSelect={this.onActivate.bind(this, account)}
                            disabled={!extended}
                          >
                            <monogram firstName={firstName || name} />
                            <title>{name}</title>
                            {isActive && (
                              <subtitle>{i18n('user-account-active')}</subtitle>
                            )}
                          </monogramLockup>
                        );
                      })}
                    </section>
                  </shelf>
                  {extended && (
                    <row style="tv-align: center; margin: 70 0 0">
                      {isFamilyAccount ? (
                        <button onSelect={this.onTurnOffFamilyAccountAttempt}>
                          <text>
                            {i18n('user-turn-off-family-account-button')}
                          </text>
                        </button>
                      ) : (
                        <button onSelect={this.onTurnOnFamilyAccountAttempt}>
                          <text>
                            {i18n('user-turn-on-family-account-button')}
                          </text>
                        </button>
                      )}
                    </row>
                  )}
                  <row style="tv-align: center; margin: 50 0 0">
                    <button onSelect={this.onLogoutAttempt}>
                      <text>{i18n('user-logout-button')}</text>
                    </button>
                  </row>
                </collectionList>
              </stackTemplate>
            </document>
          );
        },

        onTurnOnFamilyAccount() {
          const mainAccount = user.getMainAccount();

          return migrateToFamilyAccount()
            .catch(() => null)
            .then(this.selectAccount.bind(this, mainAccount.fid));
        },

        onTurnOffFamilyAccount() {
          return turnOffFamilyAccount().then(
            this.fetchAccountUpdate.bind(this),
          );
        },

        onTurnOnFamilyAccountAttempt() {
          this.onSwitchFamilyAccountStateAttempt(TURN_ON_FAMILY_ACCOUNT);
        },

        onTurnOffFamilyAccountAttempt() {
          this.onSwitchFamilyAccountStateAttempt(TURN_OFF_FAMILY_ACCOUNT);
        },

        onSwitchFamilyAccountStateAttempt(state) {
          TVDML.renderModal(
            <document>
              <alertTemplate>
                {state === TURN_ON_FAMILY_ACCOUNT && (
                  <title>{i18n('user-turn-on-family-account-title')}</title>
                )}
                {state === TURN_OFF_FAMILY_ACCOUNT && (
                  <title>{i18n('user-turn-off-family-account-title')}</title>
                )}
                {state === TURN_ON_FAMILY_ACCOUNT && (
                  <button
                    onSelect={() => {
                      this.onTurnOnFamilyAccount()
                        .then(promisedTimeout(RENDERING_DELAY))
                        .then(TVDML.removeModal);
                    }}
                  >
                    <text>
                      {i18n('user-turn-on-family-account-action_button')}
                    </text>
                  </button>
                )}
                {state === TURN_OFF_FAMILY_ACCOUNT && (
                  <button
                    onSelect={() => {
                      this.onTurnOffFamilyAccount()
                        .then(promisedTimeout(RENDERING_DELAY))
                        .then(TVDML.removeModal);
                    }}
                  >
                    <text>
                      {i18n('user-turn-off-family-account-action_button')}
                    </text>
                  </button>
                )}
                <button onSelect={() => TVDML.removeModal()}>
                  <text>
                    {i18n('user-switch-family-account-cancel_button')}
                  </text>
                </button>
              </alertTemplate>
            </document>,
          ).sink();
        },

        onLogin() {
          this.authHelper.present();
        },

        onLogout() {
          logout()
            .then(user.clear)
            .then(checkSession)
            .then(({ logged, token, till }) => {
              const family = null;
              const selected = null;
              user.set({ logged, token, till, family, selected });
              this.setState(this.getUserState());
            })
            .then(promisedTimeout(RENDERING_DELAY))
            .then(TVDML.removeModal);
        },

        onLogoutAttempt() {
          TVDML.renderModal(
            <document>
              <alertTemplate>
                <title>{i18n('user-logout-caption')}</title>
                <button onSelect={this.onLogout}>
                  <text>{i18n('user-logout-logout_button')}</text>
                </button>
                <button onSelect={() => TVDML.removeModal()}>
                  <text>{i18n('user-logout-cancel_button')}</text>
                </button>
              </alertTemplate>
            </document>,
          ).sink();
        },

        onActivate(account) {
          if (account.action === ADD_ACCOUNT) {
            this.showUserRenamePopover({
              title: i18n('user-add-account-form-title'),
              description: i18n('user-add-account-form-description'),
              button: i18n('user-add-account-form-button'),
              submit: value => {
                this.addAccount(value)
                  .then(promisedTimeout(RENDERING_DELAY))
                  .then(TVDML.removeModal);
              },
            });
          } else {
            this.onAction(account);
          }
        },

        onAction(account) {
          const { fid, name } = account;
          const isActive = this.isActiveAccount(account);

          TVDML.renderModal(
            <document>
              <alertTemplate>
                <title>{i18n('user-action-menu-title', { name })}</title>
                {!isActive && (
                  <button
                    onSelect={() => {
                      this.selectAccount(fid)
                        .then(promisedTimeout(RENDERING_DELAY))
                        .then(TVDML.removeModal);
                    }}
                  >
                    <text>{i18n('user-action-set-as-active-button')}</text>
                  </button>
                )}
                <button
                  onSelect={() => {
                    this.showUserRenamePopover({
                      title: i18n('user-rename-account-form-title', { name }),
                      description: i18n('user-rename-account-form-description'),
                      button: i18n('user-rename-account-form-button'),
                      submit: value => {
                        this.renameAccount(fid, value)
                          .then(promisedTimeout(RENDERING_DELAY))
                          .then(TVDML.removeModal);
                      },
                    });
                  }}
                >
                  <text>{i18n('user-action-rename-button')}</text>
                </button>
                {!isActive && (
                  <button
                    onSelect={() => {
                      this.deleteAccount(fid)
                        .then(promisedTimeout(RENDERING_DELAY))
                        .then(TVDML.removeModal);
                    }}
                  >
                    <text>{i18n('user-action-delete-button')}</text>
                  </button>
                )}
              </alertTemplate>
            </document>,
          ).sink();
        },

        showUserRenamePopover(params = {}) {
          TVDML.renderModal(
            TVDML.createComponent({
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
                this.setState({ value, valid: nameRegex.test(value) });
              },

              render() {
                if (this.state.loading) {
                  return <Loader />;
                }

                return (
                  <document>
                    <formTemplate>
                      <banner>
                        <title>{params.title}</title>
                        <description>{params.description}</description>
                      </banner>
                      <textField ref={node => (this.textField = node)} />
                      <footer>
                        <button
                          onSelect={this.onSubmit}
                          disabled={!this.state.valid}
                        >
                          <text>{params.button}</text>
                        </button>
                      </footer>
                    </formTemplate>
                  </document>
                );
              },

              onSubmit() {
                this.setState({ loading: true });

                if (typeof params.submit === 'function') {
                  params.submit(this.state.value);
                }
              },
            }),
          ).sink();
        },

        selectAccount(fid) {
          return selectAccount(fid).then(this.fetchAccountUpdate.bind(this));
        },

        addAccount(name) {
          return addAccount(name).then(this.fetchAccountUpdate.bind(this));
        },

        renameAccount(fid, name) {
          const boundFetchAccountUpdate = this.fetchAccountUpdate.bind(this);
          return renameAccount(fid, name).then(boundFetchAccountUpdate);
        },

        deleteAccount(fid) {
          return deleteAccount(fid).then(this.fetchAccountUpdate.bind(this));
        },

        fetchAccountUpdate() {
          return getFamilyAccounts().then(({ family, selected }) => {
            user.set({ family, selected });
            this.setState(this.getUserState());
          });
        },

        isActiveAccount(account) {
          /**
           * Из-за того что апи в некоторых случаях может выдавать разный тип
           * у `fid` приходится сравнивать значения с приведением типов.
           */
          // eslint-disable-next-line eqeqeq
          return this.state.selected.fid == account.fid;
        },
      }),
    ),
  );
}
