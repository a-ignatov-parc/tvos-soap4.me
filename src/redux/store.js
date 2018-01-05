import {
  createStore,
  combineReducers,
  applyMiddleware,
} from 'redux';

import app from './molecules/app';
import account from './molecules/account';
import support from './molecules/support';

const reducer = combineReducers({
  app,
  account,
  support,
});

const middlewares = applyMiddleware(
  app,
  account,
  support,
);

const store = createStore(reducer, middlewares);

store.subscribe(() => console.log('store update', store.getState()));

export default store;
