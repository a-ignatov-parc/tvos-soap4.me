import {
  createStore,
  combineReducers,
  applyMiddleware,
} from 'redux';

import app from './molecules/app';
import device from './molecules/device';
import account from './molecules/account';
import tvshows from './molecules/tvshows';
import settings from './molecules/settings';

const reducer = combineReducers({
  app,
  device,
  account,
  tvshows,
  settings,
});

const middlewares = applyMiddleware(
  app,
  device,
  account,
  tvshows,
  settings,
);

const store = createStore(reducer, middlewares);

store.subscribe(() => console.log('store update', store.getState()));

export default store;
