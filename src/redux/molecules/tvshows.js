import { getAllTVShows } from '../../api/client';

import stateReducer from '../reduce';
import createMolecule from '../molecule';

import {
  DATA_ERROR,
  DATA_LOADED,
  DATA_PENDING,
} from '../constants';

const GETALL = Symbol('tvshows/getall');

const ERROR = Symbol('tvshows/error');
const RESOLVE = Symbol('tvshows/resolve');

const defaultState = {
  myIds: [],
  entities: {},
  tvshowsIds: [],
  fetchStatus: DATA_PENDING,
};

function resolveResponse(response) {
  return { type: RESOLVE, data: response };
}

function handleError(error) {
  return { type: ERROR, meta: { error } };
}

export function getAllTvShows() {
  return { type: GETALL };
}

const reducer = stateReducer(defaultState, {
  [RESOLVE]: (state, { data }) => {
    const payload = data.reduce((result, item) => {
      result.tvshowsIds.push(item.sid);
      result.entities[item.sid] = item;
      return result;
    }, { tvshowsIds: [], entities: {} });

    return {
      fetchStatus: DATA_LOADED,
      ...payload,
    };
  },
});

const middleware = store => next => action => {
  if (action.type === GETALL) {
    getAllTVShows()
      .then(response => store.dispatch(resolveResponse(response)))
      .catch(error => store.dispatch(handleError(error)));
  }

  return next(action);
};

export default createMolecule({ reducer, middleware });
