import { combineReducers } from 'redux';
import {createStructuredSelector} from 'reselect';

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

export const CREATE_CONTEXTUALIZER = 'CREATE_CONTEXTUALIZER';
export const UPDATE_CONTEXTUALIZER = 'UPDATE_CONTEXTUALIZER';
export const DELETE_CONTEXTUALIZER = 'DELETE_CONTEXTUALIZER';

export const CREATE_CONTEXTUALIZATION = 'CREATE_CONTEXTUALIZATION';
export const UPDATE_CONTEXTUALIZATION = 'UPDATE_CONTEXTUALIZATION';
export const DELETE_CONTEXTUALIZATION = 'DELETE_CONTEXTUALIZATION';


export const saveAllStories = (timeAfter) => ({
  type: SAVE_ALL_STORIES,
  promise: () => {
    return writeStories(timeAfter);
  }
});

function stories(state = initialStoriesState, action) {
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
      const oldSectionsOrder = [...state[payload.storyId].sectionsOrder];
      const newSectionsOrder = [...payload.sectionsOrder];
      let resolvedSectionsOrder = [...payload.sectionsOrder];
      // new order is bigger than older order
      // (probably because a user deleted a section in the meantime)
      // --> we filter the new order with only existing sections
      if (newSectionsOrder.length > oldSectionsOrder.length) {
          resolvedSectionsOrder = newSectionsOrder.filter(
            newSectionId => oldSectionsOrder.indexOf(newSectionId) > -1
          );
      // new order is smaller than older order
      // (probably because a user created a section in the meantime)
      // --> we add created sections to the new sections
      } else if (newSectionsOrder.length < oldSectionsOrder.length) {
        resolvedSectionsOrder = [
          ...newSectionsOrder,
          ...oldSectionsOrder.slice(newSectionsOrder.length)
        ];
      }
      return {
          ...state,
          [payload.storyId]: {
            ...state[payload.storyId],
            sectionsOrder: [...resolvedSectionsOrder],
          },
          lastUpdateAt: payload.lastUpdateAt,
      };
    case CREATE_SECTION:
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          sections: {
            ...state[payload.storyId].sections,
            [payload.sectionId]: payload.section,
          },
          sectionsOrder: [...state[payload.storyId].sectionsOrder, payload.section.id],
          lastUpdateAt: payload.lastUpdateAt,
        }
      };
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
          sectionsOrder: state[payload.storyId].sectionsOrder
            .filter(
              thatSectionId =>
                thatSectionId !== payload.sectionId
            ),
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
            [payload.resourceId]: {
              ...payload.resource,
              lastUpdateAt: payload.lastUpdateAt
            },
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

    /**
     * CONTEXTUALIZATION RELATED
     */
    // contextualizations CUD
    case UPDATE_CONTEXTUALIZATION:
    case CREATE_CONTEXTUALIZATION:
      const {
        contextualizationId,
        contextualization
      } = payload;
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          contextualizations: {
            ...state[payload.storyId].contextualizations,
            [contextualizationId]: contextualization
          }
        }
      };
    case DELETE_CONTEXTUALIZATION:
      const contextualizations = {...state[payload.storyId].contextualizations};
      delete contextualizations[payload.contextualizationId];
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          contextualizations
        }
      };

    /**
     * CONTEXTUALIZER RELATED
     */
    // contextualizers CUD
    case UPDATE_CONTEXTUALIZER:
    case CREATE_CONTEXTUALIZER:
      // storyId = action.storyId;
      const {
        contextualizerId,
        contextualizer
      } = payload;
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          contextualizers: {
            ...state[payload.storyId].contextualizers,
            [contextualizerId]: contextualizer
          }
        }
      };
    case DELETE_CONTEXTUALIZER:
      contextualizers = {...state[payload.storyId].contextualizers};
      delete contextualizers[payload.contextualizerId];
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          contextualizers
        }
      };
    default:
      return state;
  }
}

export default combineReducers({
  stories,
});
/**
 * ===================================================
 * SELECTORS
 * ===================================================
 */

const storiesMap = state => state.stories;

export const selector = createStructuredSelector({
  storiesMap
});