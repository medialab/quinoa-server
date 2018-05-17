const initialConnectionsState = {};

import {CREATE_SECTION, DELETE_SECTION, INACTIVATE_STORY} from './stories';

export const ENTER_STORY = 'ENTER_STORY';
export const LEAVE_STORY = 'LEAVE_STORY';
export const DISCONNECT = 'DISCONNECT';

const ENTER_BLOCK = 'ENTER_BLOCK';
const LEAVE_BLOCK = 'LEAVE_BLOCK';

export default function connections(state = initialConnectionsState, action) {
  const {payload} = action;
  let users;
  let newState;
  const DEFAULT_LOCKING = {
    location: 'summary',
  };
  switch (action.type) {
    case ENTER_STORY:
      users = (state[payload.storyId] && state[payload.storyId].users) || {};
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          users: {
            ...users,
            [payload.userId]: DEFAULT_LOCKING
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
      users = (state[payload.storyId] && state[payload.storyId].users) || {};
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          users: {
            ...users,
            [payload.userId]: {
              blockId: payload.sectionId,
              status: 'active',
              location: 'section',
            }
          }
        }
      }
    case ENTER_BLOCK:
      users = (state[payload.storyId] && state[payload.storyId].users) || {};
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          users: {
            ...users,
            [payload.userId]: {
              ...payload,
              status: 'active',
            }
          }
        }
      }
    case LEAVE_BLOCK:
    case DELETE_SECTION:
      users = (state[payload.storyId] && state[payload.storyId].users) || {};
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          users: {
            ...users,
            [payload.userId]: DEFAULT_LOCKING,
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
