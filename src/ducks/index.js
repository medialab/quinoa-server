import * as connectionsDuck from './connections';
import * as storiesDuck from './stories';
import store from '../store/configureStore';

const selectors = (state = store.getState()) => ({
  ...connectionsDuck.selector(state.connections),
  ...storiesDuck.selector(state.stories)
});

export default selectors;