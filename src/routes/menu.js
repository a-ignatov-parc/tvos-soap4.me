/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

import * as user from '../user';
import * as localization from '../localization';
import {deepEqualShouldUpdate} from '../utils/components';

export default function(menu) {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				const language = localization.getLanguage();
				const isFamilyAccount = user.isFamily();
				const authorized = user.isAuthorized();
				const nickname = user.getLogin();

				return {
					menu,
					nickname,
					language,
					authorized,
					isFamilyAccount,
				};
			},

			componentDidMount() {
				this.languageChangeStream = localization.subscription();
				this.languageChangeStream.pipe(({language}) => this.setState({language}));

				this.userStateChangeStream = user.subscription();
				this.userStateChangeStream.pipe(() => {
					const authorized = user.isAuthorized();
					const nickname = user.getLogin();
					this.setState({nickname, authorized});
				});
			},

			componentWillUnmount() {
				this.languageChangeStream.unsubscribe();
				this.userStateChangeStream.unsubscribe();
			},

			shouldComponentUpdate: deepEqualShouldUpdate,

			render() {
				const {
					menu,
					nickname,
					authorized,
					isFamilyAccount,
				} = this.state;

				return (
					<document>
						<menuBarTemplate>
							<menuBar>
								{menu.map(({route, active}) => (
									<menuItem
										key={route}
										route={route}
										autoHighlight={active ? true : undefined}
									>
										<title>{localization.get(`menu-${route}`)}</title>
									</menuItem>
								))}
								<menuItem
									key="nickname"
									route="user"
								>
									{authorized ? (
										<title>{isFamilyAccount ? '👥' : '👤'} {nickname}</title>
									) : (
										<title>{localization.get('menu-login')}</title>
									)}
								</menuItem>
							</menuBar>
						</menuBarTemplate>
					</document>
				);
			},
		})));
}
