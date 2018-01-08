import { connect } from 'react-redux';

import { DATA_PENDING } from '../redux/constants';

import * as exports from '../redux/molecules/account';

const actions = Object
  .keys(exports)
  .reduce((result, key) => {
    if (typeof exports[key] === 'function') result[key] = exports[key];
    return result;
  }, {});

export default connect(state => {
  const {
    login,
    logged,
    extended,
    authStatus,
    fetchStatus,
  } = state.account;

  return {
    fetchingAccount: fetchStatus === DATA_PENDING,
    authorizingAccount: authStatus === DATA_PENDING,
    account: {
      login,
      logged,
      extended,
    },
  };
}, actions);
