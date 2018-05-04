const initialConnectionsState = {};

export const ENTER_STORY = 'ENTER_STORY';
export const LEAVE_STORY = 'LEAVE_STORY';
export const DISCONNECT = 'DISCONNECT';


export default function connections(state = initialConnectionsState, action) {
  const {payload} = action;
  let users;
  switch (action.type) {
    case ENTER_STORY:
      users = (state[payload.storyId] && state[payload.storyId].users) || {};
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          users: {
            ...users,
            [payload.userId]: {loc: 'summary'}
          }
        }
      }
    case LEAVE_STORY:
      users = (state[payload.storyId] && state[payload.storyId].users) || {};
      delete users[payload.userId];
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          users,
        },
      };
    case DISCONNECT:
      const newState = {...state};
      payload.rooms.forEach((room) => {
        delete newState[room].users[payload.userId];
      });
      return newState;
    default:
      return state;
  }
}
