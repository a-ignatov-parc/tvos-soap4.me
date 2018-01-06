import { connect } from 'react-redux';

import { DATA_PENDING } from '../redux/constants';

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
});
