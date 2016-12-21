/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';
import assign from 'object-assign';

import * as user from '../user';
import * as localization from '../localization';
import {deepEqualShouldUpdate} from '../utils/components';

export default function(menu) {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				const language = localization.getLanguage();
				return assign({menu, language}, this.getUserState());
			},

			getUserState() {
				const authorized = user.isAuthorized();
				const nickname = user.getLogin();
				return {nickname, authorized};
			},

			componentDidMount() {
				this.languageChangeStream = localization.subscription();
				this.languageChangeStream.pipe(({language}) => this.setState({language}));

				this.userStateChangeStream = user.subscription();
				this.userStateChangeStream.pipe(() => this.setState(this.getUserState()));
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
										<title>👤 {nickname}</title>
									) : (
										<title>{localization.get('menu-account')}</title>
									)}
								</menuItem>
							</menuBar>
						</menuBarTemplate>
					</document>
				);
			},
		})));
}
