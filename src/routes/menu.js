/** @jsx TVDML.jsx */

import * as TVDML from 'tvdml';

import moment from 'moment';
import assign from 'object-assign';

import * as user from '../user';
import * as localization from '../localization';
import {deepEqualShouldUpdate} from '../utils/components';

import {AUTH, GUEST} from './menu/constants';

const datePattern = 'DD-MM-YYYY';

export default function(menu) {
	return TVDML
		.createPipeline()
		.pipe(TVDML.render(TVDML.createComponent({
			getInitialState() {
				const language = localization.getLanguage();
				return assign({menu, language}, this.getUserState());
			},

			getUserState() {
				const nickname = user.getLogin();
				const authorized = user.isAuthorized();
				const isFamilyAccount = user.isFamily();
				const avatar = isFamilyAccount ? '👪' : this.getUserIcon();
				return {nickname, authorized, isFamilyAccount, avatar};
			},

			componentDidMount() {
				this.languageChangeStream = localization.subscription();
				this.languageChangeStream.pipe(({language}) => this.setState({language}));

				this.userStateChangeStream = user.subscription();
				this.userStateChangeStream.pipe(() => this.setState(this.getUserState()));

				this.appResumeStream = TVDML.subscribe(TVDML.event.RESUME);
				this.appResumeStream.pipe(() => this.setState(this.getUserState()));
			},

			componentWillUnmount() {
				this.appResumeStream.unsubscribe();
				this.languageChangeStream.unsubscribe();
				this.userStateChangeStream.unsubscribe();
			},

			shouldComponentUpdate: deepEqualShouldUpdate,

			render() {
				const {
					menu,
					avatar,
					nickname,
					authorized,
				} = this.state;

				const menuItems = menu.filter(({hidden}) => !this.resolveToken(hidden));

				return (
					<document>
						<menuBarTemplate>
							<menuBar>
								{menuItems.map(({route, active}) => {
									const isActive = this.resolveToken(active);

									return (
										<menuItem
											key={route}
											route={route}
											autoHighlight={isActive || undefined}
										>
											<title>{localization.get(`menu-${route}`)}</title>
										</menuItem>
									);
								})}
								<menuItem
									key="nickname"
									route="user"
								>
									{authorized ? (
										<title>{avatar} {nickname}</title>
									) : (
										<title>{localization.get('menu-account')}</title>
									)}
								</menuItem>
							</menuBar>
						</menuBarTemplate>
					</document>
				);
			},

			resolveToken(token) {
				return typeof(token) === 'boolean'
					? token
					: this.state.authorized
						? token === AUTH
						: token === GUEST;
			},

			getUserIcon() {
				if (moment().isSame(moment('01-01', datePattern).add(256, 'days'))) return '👨‍💻';
				if (this.currentDateIsBetween('01-01', '07-01')) return '🎅';
				if (this.currentDateIs('31-10')) return '🎃';
				if (this.currentDateIs('14-02')) return '❤️';
				if (this.currentDateIs('01-03')) return '🌹';
				if (this.currentDateIs('01-06')) return '🌻';
				if (this.currentDateIs('09-07')) return '🦄';
				return '👱';
			},

			currentDateIs(date) {
				return moment().isSame(moment(date, datePattern));
			},

			currentDateIsBetween(start, end) {
				return moment().isBetween(moment(start, datePattern), moment(end, datePattern));
			},
		})));
}
