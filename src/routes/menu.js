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
				let language = localization.getLanguage();

				return {
					menu,
					language,
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
				return (
					<document>
						<menuBarTemplate>
							<menuBar>
								{this.state.menu.map(({route, active}) => (
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
									{user.isAuthorized() ? (
										<title>👤 {user.getLogin()}</title>
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
