const initialConnectionsState = {};

export const LOGIN_STORY = 'LOGIN_STORY';
export const ENTER_STORY = 'ENTER_STORY';
export const LEAVE_STORY = 'LEAVE_STORY';


export default function connections(state = initialConnectionsState, action) {
  const {payload} = action;
  switch (action.type) {
    case `${ENTER_STORY}_SUCCESS`:
      return {
        ...state,
        [payload.storyId]: payload
      }
    default:
      return state;
  }
}
