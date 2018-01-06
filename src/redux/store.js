import {
  createStore,
  combineReducers,
  applyMiddleware,
} from 'redux';

import app from './molecules/app';
import account from './molecules/account';
import support from './molecules/support';
import tvshows from './molecules/tvshows';

const reducer = combineReducers({
  app,
  account,
  support,
  tvshows,
});

const middlewares = applyMiddleware(
  app,
  account,
  support,
  tvshows,
);

const store = createStore(reducer, middlewares);

store.subscribe(() => console.log('store update', store.getState()));

export default store;
