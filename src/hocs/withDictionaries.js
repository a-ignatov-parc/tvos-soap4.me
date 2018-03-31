import { connect } from 'react-redux';

import { DATA_PENDING } from '../redux/constants';

import * as exports from '../redux/molecules/dictionaries';

const actions = Object
  .keys(exports)
  .reduce((result, key) => {
    if (typeof exports[key] === 'function') result[key] = exports[key];
    return result;
  }, {});

export default connect(state => {
  const {
    genres,
    countries,
    fetchStatus,
  } = state.dictionaries;

  return {
    genres,
    countries,
    fetchingDictionaries: fetchStatus === DATA_PENDING,
  };
}, actions);
