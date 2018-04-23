import {combineReducers} from 'redux';
import stories from '../ducks/stories';
import connections from '../ducks/connections';

const rootReducer = combineReducers({
  stories,
  connections
});

export default rootReducer;