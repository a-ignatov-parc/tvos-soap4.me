import { Fragment, PureComponent } from 'react';
import PropTypes from 'prop-types';

import withAccount from '../hocs/withAccount';

import Loader from '../components/Loader';

export const USER = Symbol('menu/user');
export const GUEST = Symbol('menu/guest');

function MenuRenderer(props, context) {
  const {
    userStatus,
    systemItems,
  } = props;

  const items = []
    .concat(context.menu.getItems(), systemItems)
    .filter(Boolean)
    .filter(({ hiddenFor }) => hiddenFor !== userStatus)

  console.log(888, items, props);

  return (
    <document>
      <menuBarTemplate>
        <menuBar>
          {items.map(item => (
            <menuItem
              key={item.route}
              route={item.route}
              autoHighlight={item.activeFor === userStatus}
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
    title: PropTypes.string.isRequired,
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
  children: PropTypes.string.isRequired,
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

  render() {
    const {
      account,
      children,
      fetchingAccount,
    } = this.props;

    if (fetchingAccount) {
      return (
        <Loader title='Checking authorization...' />
      );
    }

    /**
     * Before every render we're reseting items list.
     * It's idempotent side effect.
     */
    this.menuItems.length = 0;

    console.log(777, account);

    const accountItem = {
      title: 'Account',
      route: 'user',
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
