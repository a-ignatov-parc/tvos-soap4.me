import {
  getGenresList,
  getCountriesList,
} from '../../api/client';

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
  genres: [],
  countries: [],
  fetchStatus: DATA_PENDING,
};

function resolveResponse(response) {
  return { type: RESOLVE, data: response };
}

function handleError(error) {
  return { type: ERROR, meta: { error } };
}

export function getAllDictionaries() {
  return { type: GETALL };
}

const reducer = stateReducer(defaultState, {
  [RESOLVE]: (state, { data }) => {
    const [
      genres,
      countries,
    ] = data;

    return {
      genres,
      countries,
      fetchStatus: DATA_LOADED,
    };
  },
});

const middleware = store => next => action => {
  if (action.type === GETALL) {
    Promise
      .all([
        getGenresList(),
        getCountriesList(),
      ])
      .then(response => store.dispatch(resolveResponse(response)))
      .catch(error => store.dispatch(handleError(error)));
  }

  return next(action);
};

export default createMolecule({ reducer, middleware });
