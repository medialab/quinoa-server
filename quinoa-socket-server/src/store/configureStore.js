import {combineReducers} from 'redux';
import {createStore, applyMiddleware} from 'redux';
import { composeWithDevTools } from 'remote-redux-devtools';
// import devToolsEnhancer from 'remote-redux-devtools';

import rootReducer from './rootReducer';

const composeEnhancers = composeWithDevTools(
  {realtime: true, suppressConnectErrors: false}
);

export default function configureStore(initialState={}) {
  const store = createStore(rootReducer, initialState, composeEnhancers(
    // applyMiddleware()
  ));
  // const store = createStore(rootReducer, initialState, devToolsEnhancer({realtime: true}));
  return store;
}
