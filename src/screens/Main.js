import { Fragment, PureComponent } from 'react';
import PropTypes from 'prop-types';
import moment from 'moment';

import withAccount from '../hocs/withAccount';

import Text from '../components/Text';
import Loader from '../components/Loader';

export const USER = Symbol('menu/user');
export const GUEST = Symbol('menu/guest');

let initiallyFocused = false;

const datePattern = 'DD-MM-YYYY';

function currentDateIs(date) {
  return moment().isSame(moment(date, datePattern));
}

function currentDateIsBetween(start, end) {
  const startMoment = moment(start, datePattern);
  const endMoment = moment(end, datePattern);
  return moment().isBetween(startMoment, endMoment);
}

function getUserIcon() {
  if (moment().isSame(moment('01-01', datePattern).add(256, 'days'))) {
    return '👨‍💻';
  }
  if (currentDateIsBetween('01-01', '07-01')) return '🎅';
  if (currentDateIs('31-10')) return '🎃';
  if (currentDateIs('14-02')) return '❤️';
  if (currentDateIs('01-03')) return '🌹';
  if (currentDateIs('01-06')) return '🌻';
  if (currentDateIs('09-07')) return '🦄';
  return '👱';
}

function MenuRenderer(props, context) {
  const {
    userStatus,
    systemItems,
  } = props;

  const items = []
    .concat(context.menu.getItems(), systemItems)
    .filter(Boolean)
    .filter(({ hiddenFor }) => hiddenFor !== userStatus);

  const shouldFocus = !initiallyFocused;

  initiallyFocused = true;

  console.log(888, items, props);

  return (
    <document>
      <menuBarTemplate>
        <menuBar>
          {items.map(item => (
            <menuItem
              key={item.route}
              route={item.route}
              autoHighlight={shouldFocus && item.activeFor === userStatus}
            >
              <title>{item.title}</title>
            </menuItem>
          ))}
        </menuBar>
      </menuBarTemplate>
    </document>
  );
}

MenuRenderer.contextTypes = {
  menu: PropTypes.shape({
    getItems: PropTypes.func.isRequired,
  }),
};

MenuRenderer.propTypes = {
  userStatus: PropTypes.oneOf([USER, GUEST]),
  systemItems: PropTypes.arrayOf(PropTypes.shape({
    route: PropTypes.string.isRequired,
    title: PropTypes.node.isRequired,
  })),
};

MenuRenderer.defaultProps = {
  userStatus: GUEST,
};

export function Menu(props) {
  return [].concat(props.children).filter(child => {
    return child && child.type === MenuItem;
  });
}

export function MenuItem(props, context) {
  const {
    route,
    activeFor,
    hiddenFor,
    children: title,
  } = props;

  context.menu.registerItem({
    route,
    title,
    activeFor,
    hiddenFor,
  });

  return null;
}

MenuItem.contextTypes = {
  menu: PropTypes.shape({
    registerItem: PropTypes.func.isRequired,
  }),
};

MenuItem.propTypes = {
  route: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  activeFor: PropTypes.oneOf([USER, GUEST]),
  hiddenFor: PropTypes.oneOf([USER, GUEST]),
};

class Main extends PureComponent {
  static childContextTypes = {
    menu: PropTypes.shape({
      getItems: PropTypes.func,
      registerItem: PropTypes.func,
      unregisterItem: PropTypes.func,
    }),
  };

  menuItems = [];

  menu = {
    getItems: () => this.menuItems.slice(0),
    registerItem: (propName) => this.menuItems.push(propName),
    unregisterItem: (propName) => this.menuItems.push(propName),
  };

  getChildContext() {
    return {
      menu: this.menu,
    };
  }

  componentDidMount() {
    this.props.checkAuthorization();
  }

  render() {
    const {
      account,
      children,
      fetchingAccount,
    } = this.props;

    if (fetchingAccount) {
      return (
        <Loader>
          <Text i18n='auth-checking' />
        </Loader>
      );
    }

    /**
     * Before every render we're reseting items list.
     * It's idempotent side effect.
     */
    this.menuItems.length = 0;

    const accountItem = {
      route: 'account',
      title: account.logged
        ? `${getUserIcon()} ${account.login}`
        : <Text i18n='menu-account' />,
    };

    return (
      <Fragment>
        {children}
        <MenuRenderer
          systemItems={[accountItem]}
          userStatus={account.logged ? USER : GUEST}
        />
      </Fragment>
    );
  }
}

export default withAccount(Main);
