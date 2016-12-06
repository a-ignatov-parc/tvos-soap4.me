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
				const authorized = user.isAuthorized();
				const nickname = user.getLogin();

				return {
					menu,
					nickname,
					language,
					authorized,
				};
			},

			componentDidMount() {
				this.languageChangeStream = localization.subscription();
				this.languageChangeStream.pipe(({language}) => this.setState({language}));
			},

			componentWillUnmount() {
				this.languageChangeStream.unsubscribe();
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
