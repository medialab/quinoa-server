import { combineReducers } from 'redux';


import {CREATE_SECTION, DELETE_SECTION, INACTIVATE_STORY, DELETE_STORY} from './stories';

export const ENTER_STORY = 'ENTER_STORY';
export const LEAVE_STORY = 'LEAVE_STORY';

const ENTER_BLOCK = 'ENTER_BLOCK';
const IDLE_BLOCK = 'IDLE_BLOCK';
const LEAVE_BLOCK = 'LEAVE_BLOCK';

const USER_CONNECTED = 'USER_CONNECTED';
const USER_DISCONNECTING = 'USER_DISCONNECTING';
const USER_DISCONNECTED = 'USER_DISCONNECTED';

const USERS_DEFAULT_STATE = {
  count: 0,
};

function users(state = USERS_DEFAULT_STATE, action) {
  let newCount;
  switch (action.type) {
    case USER_CONNECTED:
      newCount = state.count + 1;
      return {
        ...state,
        count: newCount,
      };
    case USER_DISCONNECTED:
      newCount = state.count - 1;
      return {
        ...state,
        count: newCount,
      };
    default:
      return state;
  }
}

const LOCKING_DEFAULT_STATE = {};
function locking(state = LOCKING_DEFAULT_STATE, action) {
  const {payload} = action;
  let locks;
  let newState;
  const DEFAULT_LOCKS = {
    summary: true,
  };
  switch (action.type) {
    case ENTER_STORY:
      locks = (state[payload.storyId] && state[payload.storyId].locks) || {};
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          locks: {
            ...locks,
            [payload.userId]: DEFAULT_LOCKS,
          },
        },
      };
    case INACTIVATE_STORY:
    case DELETE_STORY:
      newState = {...state};
      delete newState[payload.id];
      return newState;
    case LEAVE_STORY:
      locks = (state[payload.storyId] && state[payload.storyId].locks) || {};
      delete locks[payload.userId];
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          locks,
        },
      };
    case CREATE_SECTION:
      locks = (state[payload.storyId] && state[payload.storyId].locks) || {};
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          locks: {
            ...locks,
            [payload.userId]: {
              ...locks[payload.userId],
              sections: {
                blockId: payload.sectionId,
                status: 'active',
                location: 'sections',
              },
            },
          },
        },
      };
    case ENTER_BLOCK:
      locks = (state[payload.storyId] && state[payload.storyId].locks) || {};
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          locks: {
            ...locks,
            [payload.userId]: {
              ...locks[payload.userId],
              [payload.location]: {
                ...payload,
                status: 'active',
              },
            },
          },
        },
      };
    case IDLE_BLOCK:
      locks = (state[payload.storyId] && state[payload.storyId].locks) || {};
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          locks: {
            ...locks,
            [payload.userId]: {
              ...locks[payload.userId],
              [payload.location]: {
                ...payload,
                status: 'idle',
              },
            },
          },
        }
      }
    case LEAVE_BLOCK:
    case DELETE_SECTION:
      locks = (state[payload.storyId] && state[payload.storyId].locks) || {};
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          locks: {
            ...locks,
            [payload.userId]: {
              ...locks[payload.userId],
              [payload.location]: undefined,
            },
          },
        },
      };
    case USER_DISCONNECTING:
      newState = {...state};
      payload.rooms.forEach((room) => {
        if (newState[room])
          delete newState[room].locks[payload.userId];
      });
      return newState;
    default:
      return state;
  }
}


export default combineReducers({
  locking,
  users,
});