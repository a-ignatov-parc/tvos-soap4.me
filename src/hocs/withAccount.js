import { connect } from 'react-redux';

import { DATA_LOADED } from '../redux/constants';

export default connect(state => {
  const {
    meta,
    ...account,
  } = state.account;

  return {
    account,
    accountIsLoading: meta.status !== DATA_LOADED,
  };
});
