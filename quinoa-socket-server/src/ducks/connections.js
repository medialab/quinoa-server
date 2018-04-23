const initialConnectionsState = {};

export const ENTER_STORY = 'server/ENTER_STORY';

export default function connections(state = initialConnectionsState, action) {
  const {payload} = action;
  switch (action.type) {
    case ENTER_STORY:
      return {
        ...state,
        [payload.storyId]: payload.userId
      }
    default:
      return state;
  }
}
