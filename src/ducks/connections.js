import { combineReducers } from 'redux';
import {createStructuredSelector} from 'reselect';

import {CREATE_SECTION, DELETE_SECTION, INACTIVATE_STORY, DELETE_STORY} from './stories';

export const ENTER_STORY = 'ENTER_STORY';
export const LEAVE_STORY = 'LEAVE_STORY';

export const ENTER_BLOCK = 'ENTER_BLOCK';
export const LEAVE_BLOCK = 'LEAVE_BLOCK';

const USER_CONNECTED = 'USER_CONNECTED';
const USER_DISCONNECTING = 'USER_DISCONNECTING';
const USER_DISCONNECTED = 'USER_DISCONNECTED';

export const SET_USER_AS_IDLE = 'SET_USER_AS_IDLE';
export const SET_USER_AS_ACTIVE = 'SET_USER_AS_ACTIVE';

const CREATE_USER = 'CREATE_USER';

const USERS_DEFAULT_STATE = {
  count: 0,
  users: {},
};

function users(state = USERS_DEFAULT_STATE, action) {
  let newCount;
  let newUsers;
  const {payload} = action;
  switch (action.type) {
    case CREATE_USER:
      return {
        ...state,
        users: {
          ...state.users,
          [payload.userId]: payload
        },
      }
    case USER_CONNECTED:
      newCount = state.count + 1;
      return {
        ...state,
        count: newCount,
      };
    case USER_DISCONNECTED:
      newCount = state.count - 1;
      newUsers = {...state.users};
      delete newUsers[payload.userId]
      return {
        ...state,
        users: newUsers,
        count: newCount,
      };
    default:
      return state;
  }
}

const LOCKING_DEFAULT_STATE = {};
const DEFAULT_LOCKS = {};
function locking(state = LOCKING_DEFAULT_STATE, action) {
  const {payload = {}} = action;
  let locks;
  let newState;
  let userLocks;
  let newLocks;
  const now = new Date().getTime();
  switch (action.type) {
    case ENTER_STORY:
      locks = (state[payload.storyId] && state[payload.storyId].locks) || {};
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          locks: {
            ...locks,
            [payload.userId]: {
              ...DEFAULT_LOCKS,
              lastActivityAt: now ,
              status: 'active',
            },
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
    // case CREATE_SECTION:
    //   locks = (state[payload.storyId] && state[payload.storyId].locks) || {};
    //   return {
    //     ...state,
    //     [payload.storyId]: {
    //       ...state[payload.storyId],
    //       locks: {
    //         ...locks,
    //         [payload.userId]: {
    //           ...locks[payload.userId],
    //           sections: {
    //             blockId: payload.sectionId,
    //             status: 'active',
    //             blockType: 'sections',
    //           },
    //         },
    //       },
    //     },
    //   };
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
              [payload.blockType]: {
                ...payload,
                status: 'active',
              },
              status: 'active',
              lastActivityAt: now
            },
          },
        },
      };
    case SET_USER_AS_IDLE:
      locks = (state[payload.storyId] && state[payload.storyId].locks) || {};
      userLocks = locks[payload.userId] || {};
      newLocks = Object.keys(userLocks).reduce((result, key) => {
        const val = userLocks[key];
        if (typeof val === 'object' && val.status) {
          return {
            ...result,
            [key]: {
              ...val,
              status: 'idle'
            }
          };
        }
        return {
          ...result,
          [key]: val
        }
      }, {});
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          locks: {
            ...locks,
            [payload.userId]: {
              ...newLocks,
              status: 'idle',
            },
          },
        }
      }
    case SET_USER_AS_ACTIVE:
      locks = (state[payload.storyId] && state[payload.storyId].locks) || {};
      userLocks = locks[payload.userId] || {};
      newLocks = Object.keys(userLocks).reduce((result, key) => {
        const val = userLocks[key];
        if (typeof val === 'object' && val.status) {
          return {
            ...result,
            [key]: {
              ...val,
              status: 'active'
            }
          };
        }
        return {
          ...result,
          [key]: val
        }
      }, {});
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          locks: {
            ...locks,
            [payload.userId]: {
              ...newLocks,
              status: 'active',
              lastActivityAt: now
            },
          },
        }
      }
    case LEAVE_BLOCK:
      locks = (state[payload.storyId] && state[payload.storyId].locks) || {};
      if (locks[payload.userId]) {
        return {
          ...state,
          [payload.storyId]: {
            ...state[payload.storyId],
            locks: {
              ...locks,
              [payload.userId]: {
                ...locks[payload.userId],
                [payload.blockType]: undefined,
                lastActivityAt: now,
              },
            },
          },
        };
      }
      else return state;
    /**
     * update locking system by room manually (server)
     */
    case USER_DISCONNECTING:
      newState = {...state};
      payload.rooms.forEach((room) => {
        if (newState[room])
          delete newState[room].locks[payload.userId];
      });
      return newState;
    default:
      if (payload.userId && payload.storyId) {
        locks = (state[payload.storyId] && state[payload.storyId].locks) || {};
        const userLocks = locks[payload.userId] || {};
        const newLocks = Object.keys(userLocks).reduce((result, key) => {
          const val = userLocks[key];
          if (typeof val === 'object' && val.status) {
            return {
              ...result,
              [key]: {
                ...val,
                status: 'active'
              }
            };
          }
          return {
            ...result,
            [key]: val
          }
        }, {})
        return {
          ...state,
          [payload.storyId]: {
            ...state[payload.storyId],
            locks: {
              ...locks,
              [payload.userId]: {
                ...newLocks,
                lastActivityAt: now,
                status: 'active',
              }
            }
          }
        }
      }
      return state;
  }
}


export default combineReducers({
  locking,
  users,
});

/**
 * ===================================================
 * SELECTORS
 * ===================================================
 */

const lockingMap = state => state.locking;

export const selector = createStructuredSelector({
  lockingMap
});
