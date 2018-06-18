import {combineReducers} from 'redux';
import {createStore, applyMiddleware} from 'redux';
import { composeWithDevTools } from 'remote-redux-devtools';
// import devToolsEnhancer from 'remote-redux-devtools';

import rootReducer from './rootReducer';

const PROD = process.env.NODE_ENV === 'production';

function configureStore(initialState={}) {
  let store;

  // In prod, we don't use the remote dev server
  if (PROD) {
    store = createStore(rootReducer, initialState);
  }
  else {
    const composeEnhancers = composeWithDevTools(
      {realtime: true, suppressConnectErrors: false}
    );

    store = createStore(rootReducer, initialState, composeEnhancers(
      // applyMiddleware()
    ));
    // const store = createStore(rootReducer, initialState, devToolsEnhancer({realtime: true}));
  }

  return store;
}

const store = configureStore();
export default store;
