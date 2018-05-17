const initialConnectionsState = {};

import {CREATE_SECTION, DELETE_SECTION, INACTIVATE_STORY} from './stories';

export const ENTER_STORY = 'ENTER_STORY';
export const LEAVE_STORY = 'LEAVE_STORY';
export const DISCONNECT = 'DISCONNECT';

const ENTER_SECTION = 'ENTER_SECTION';
const LEAVE_SECTION = 'LEAVE_SECTION';

export default function connections(state = initialConnectionsState, action) {
  const {payload} = action;
  let users;
  let newState;
  switch (action.type) {
    case ENTER_STORY:
      users = (state[payload.storyId] && state[payload.storyId].users) || {};
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          users: {
            ...users,
            [payload.userId]: 'summary'
          }
        }
      }
    case INACTIVATE_STORY:
      newState = {...state};
      delete newState[payload.id];
      return newState;
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
    case CREATE_SECTION:
    case ENTER_SECTION:
      users = (state[payload.storyId] && state[payload.storyId].users) || {};
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          users: {
            ...users,
            [payload.userId]: payload.sectionId
          }
        }
      }
    case LEAVE_SECTION:
    case DELETE_SECTION:
      users = (state[payload.storyId] && state[payload.storyId].users) || {};
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          users: {
            ...users,
            [payload.userId]: 'summary',
          },
        },
      };
    case DISCONNECT:
      newState = {...state};
      payload.rooms.forEach((room) => {
        delete newState[room].users[payload.userId];
      });
      return newState;
    default:
      return state;
  }
}
