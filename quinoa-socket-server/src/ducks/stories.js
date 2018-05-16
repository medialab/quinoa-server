import {writeStories} from '../services/stories';

const initialStoriesState = {};

export const ACTIVATE_STORY = 'ACTIVATE_STORY';
export const DELETE_STORY = 'DELETE_STORY';
export const SAVE_ALL_STORIES = 'SAVE_ALL_STORIES';

export const CREATE_SECTION = 'CREATE_SECTION';
export const UPDATE_SECTION = 'UPDATE_SECTION';
export const DELETE_SECTION = 'DELETE_SECTION';

export const saveAllStories = () => ({
  type: SAVE_ALL_STORIES,
  promise: () => writeStories()
})

export default function stories(state = initialStoriesState, action) {
  const {payload, socket} = action;
  switch (action.type) {
    case ACTIVATE_STORY:
      return {
        ...state,
        [payload.id]: payload
      };
    case DELETE_STORY:
      const newState = {...state};
      delete newState[payload.id];
      return newState;
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
        }
      };
    default:
      return state;
  }
}