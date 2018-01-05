import {
  createStore,
  combineReducers,
  applyMiddleware,
} from 'redux';

const reducer = combineReducers({
  app: appReducer,
  counter: counterReducer,
});

const middlewares = applyMiddleware(counterMiddleware);

export default createStore(reducer, middlewares);
