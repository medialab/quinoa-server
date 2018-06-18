import * as connectionsDuck from './connections';
import * as storiesDuck from './stories';

const selectors = state => ({
  ...connectionsDuck.selector(state.connections),
  ...storiesDuck.selector(state.stories)
});

export default selectors;