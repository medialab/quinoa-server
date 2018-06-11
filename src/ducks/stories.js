import {writeStories} from '../services/stories';

const initialStoriesState = {};

export const ACTIVATE_STORY = 'ACTIVATE_STORY';
export const INACTIVATE_STORY = 'INACTIVATE_STORY';

export const DELETE_STORY = 'DELETE_STORY';
export const SAVE_ALL_STORIES = 'SAVE_ALL_STORIES';

export const CREATE_SECTION = 'CREATE_SECTION';
export const UPDATE_SECTION = 'UPDATE_SECTION';
export const DELETE_SECTION = 'DELETE_SECTION';

export const CREATE_RESOURCE = 'CREATE_RESOURCE';
export const UPDATE_RESOURCE = 'UPDATE_RESOURCE';
export const DELETE_RESOURCE = 'DELETE_RESOURCE';

export const UPDATE_STORY_METADATA = 'UPDATE_STORY_METADATA';
export const UPDATE_SECTIONS_ORDER = 'UPDATE_SECTIONS_ORDER';

export const saveAllStories = (timeAfter) => ({
  type: SAVE_ALL_STORIES,
  promise: () => {
    return writeStories(timeAfter);
  }
});

export default function stories(state = initialStoriesState, action) {
  const {payload} = action;
  switch (action.type) {
    case ACTIVATE_STORY:
      return {
        ...state,
        [payload.id]: payload
      };
    case DELETE_STORY:
    case INACTIVATE_STORY:
      const newState = {...state};
      delete newState[payload.id];
      return newState;
    case UPDATE_STORY_METADATA:
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          metadata: payload.metadata,
          lastUpdateAt: payload.lastUpdateAt,
        }
      };
    case UPDATE_SECTIONS_ORDER:
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          sectionsOrder: payload.sectionsOrder,
          lastUpdateAt: payload.lastUpdateAt,
        }
      };
    case CREATE_SECTION:
    case UPDATE_SECTION:
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          sections: {
            ...state[payload.storyId].sections,
            [payload.sectionId]: payload.section,
          },
          lastUpdateAt: payload.lastUpdateAt,
        }
      };
    case DELETE_SECTION:
    case `${DELETE_SECTION}_BROADCAST`:
      const newSections = { ...state[payload.storyId].sections };
      delete newSections[payload.sectionId];
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          sections: newSections,
          lastUpdateAt: payload.lastUpdateAt,
        }
      };
    case CREATE_RESOURCE:
    case UPDATE_RESOURCE:
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          resources: {
            ...state[payload.storyId].resources,
            [payload.resourceId]: payload.resource,
          },
          lastUpdateAt: payload.lastUpdateAt,
        }
      };
    case DELETE_RESOURCE:
      const newResources = { ...state[payload.storyId].resources };
      delete newResources[payload.resourceId];
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          resources: newResources,
          lastUpdateAt: payload.lastUpdateAt,
        },
      };
    default:
      return state;
  }
}