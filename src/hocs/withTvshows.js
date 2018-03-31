import { connect } from 'react-redux';

import { DATA_PENDING } from '../redux/constants';

import * as exports from '../redux/molecules/tvshows';

const actions = Object
  .keys(exports)
  .reduce((result, key) => {
    if (typeof exports[key] === 'function') result[key] = exports[key];
    return result;
  }, {});

export default connect(state => {
  const {
    entities,
    tvshowsIds,
    fetchStatus,
  } = state.tvshows;

  return {
    fetchingTvshows: fetchStatus === DATA_PENDING,
    tvshows: tvshowsIds.map(sid => entities[sid]),
  };
}, actions);
