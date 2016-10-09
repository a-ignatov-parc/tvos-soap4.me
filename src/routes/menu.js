/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

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
				this.languageChangePipeline = localization
					.subscription()
					.pipe(({language}) => this.setState({language}));
			},

			componentWillUnmount() {
				this.languageChangePipeline.unsubscribe();
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
							</menuBar>
						</menuBarTemplate>
					</document>
				);
			},
		})));
}
