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
export const UPDATE_STORY_SETTINGS = 'UPDATE_STORY_SETTINGS';
export const SET_SECTION_LEVEL = 'SET_SECTION_LEVEL';

export const CREATE_CONTEXTUALIZER = 'CREATE_CONTEXTUALIZER';
export const UPDATE_CONTEXTUALIZER = 'UPDATE_CONTEXTUALIZER';
export const DELETE_CONTEXTUALIZER = 'DELETE_CONTEXTUALIZER';

export const CREATE_CONTEXTUALIZATION = 'CREATE_CONTEXTUALIZATION';
export const UPDATE_CONTEXTUALIZATION = 'UPDATE_CONTEXTUALIZATION';
export const DELETE_CONTEXTUALIZATION = 'DELETE_CONTEXTUALIZATION';

export const CREATE_STORY_OBJECTS = 'CREATE_STORY_OBJECTS';


export const SET_COVER_IMAGE = 'SET_COVER_IMAGE';

export const saveAllStories = (timeAfter) => ({
  type: SAVE_ALL_STORIES,
  promise: () => {
    return writeStories(timeAfter);
  }
});

function stories(state = initialStoriesState, action) {
  const {payload} = action;
  let contextualizations;
  let contextualizers;
  let contextualizationsToDeleteIds;
  let contextualizersToDeleteIds;
  let newSectionsOrder;
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
    case UPDATE_STORY_SETTINGS:
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          settings: payload.settings,
          lastUpdateAt: payload.lastUpdateAt,
        }
      };
    case UPDATE_SECTIONS_ORDER:
      const oldSectionsOrder = [...state[payload.storyId].sectionsOrder];
      newSectionsOrder = [...payload.sectionsOrder];
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
      const sectionIndex = payload.sectionIndex || state[payload.storyId].sectionsOrder.length - 1;
      newSectionsOrder = sectionIndex < state[payload.storyId].sectionsOrder.length ?
            [
              ...state[payload.storyId].sectionsOrder.slice(0, sectionIndex),
              payload.sectionId,
            ...state[payload.storyId].sectionsOrder.slice(sectionIndex)
            ]
            :
            [
              ...state[payload.storyId].sectionsOrder,
              payload.sectionId
            ]
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          sections: {
            ...state[payload.storyId].sections,
            [payload.sectionId]: payload.section,
          },
          sectionsOrder: newSectionsOrder,
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
    case SET_SECTION_LEVEL:
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          sections: {
            ...state[payload.storyId].sections,
            [payload.sectionId]: {
              ...state[payload.storyId].sections[payload.sectionId],
              metadata: {
                ...state[payload.storyId].sections[payload.sectionId].metadata,
                level: payload.level
              }
            }
          },
          lastUpdateAt: payload.lastUpdateAt,
        }
      };
    case DELETE_SECTION:
      const newSections = { ...state[payload.storyId].sections };
      delete newSections[payload.sectionId];

      contextualizations = {...state[payload.storyId].contextualizations};
      contextualizers = {...state[payload.storyId].contextualizers};

      contextualizationsToDeleteIds = Object.keys(contextualizations)
      .filter(id => {
        return contextualizations[id].sectionId === payload.sectionId;
      });
      contextualizersToDeleteIds = [];

      contextualizationsToDeleteIds
      .forEach((id) => {
        contextualizersToDeleteIds.push(contextualizations[id].contextualizerId);
      });

      contextualizersToDeleteIds.forEach(contextualizerId => {
        delete contextualizers[contextualizerId];
      });
      contextualizationsToDeleteIds.forEach(contextualizationId => {
        delete contextualizations[contextualizationId];
      });
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
          contextualizations,
          contextualizers,
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

      contextualizations = {...state[payload.storyId].contextualizations};
      contextualizers = {...state[payload.storyId].contextualizers};
      // for now as the app does not allow to reuse the same contextualizer for several resources
      // we will delete associated contextualizers as well as associated contextualizations
      // (forseeing long edition sessions in which user create and delete a large number of contextualizations
      // if not doing so we would end up with a bunch of unused contextualizers in documents' data after a while)

      // we will store contextualizers id to delete here
      contextualizersToDeleteIds = [];

      // we will store contextualizations id to delete here
      contextualizationsToDeleteIds = [];
      // spot all objects to delete
      Object.keys(contextualizations)
        .forEach(contextualizationId => {
          if (contextualizations[contextualizationId].resourceId === payload.resourceId) {
            contextualizationsToDeleteIds.push(contextualizationId);
            contextualizersToDeleteIds.push(contextualizations[contextualizationId].contextualizerId);
          }
        });
      // proceed to deletions
      contextualizersToDeleteIds.forEach(contextualizerId => {
        delete contextualizers[contextualizerId];
      });
      contextualizationsToDeleteIds.forEach(contextualizationId => {
        delete contextualizations[contextualizationId];
      });
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          resources: newResources,
          contextualizers,
          contextualizations,
          lastUpdateAt: payload.lastUpdateAt,
        },
      };

    /**
     * CONTEXTUALIZATIONS AND CONTEXTUALIZERS RELATED
     */
    case CREATE_STORY_OBJECTS:
      const {
        contextualizations : newContextualizations = {},
        contextualizers : newContextualizers = {},
        storyId,
        lastUpdateAt,
      } = payload;
      return {
        ...state,
        [storyId]: {
          ...state[payload.storyId],
          contextualizations: {
            ...state[payload.storyId].contextualizations,
            ...newContextualizations,
          },
          contextualizers: {
            ...state[payload.storyId].contextualizers,
            ...newContextualizers,
          },
          lastUpdateAt,
        }
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
          },
          lastUpdateAt: payload.lastUpdateAt,
        }
      };
    case DELETE_CONTEXTUALIZATION:
      contextualizations = {...state[payload.storyId].contextualizations};
      delete contextualizations[payload.contextualizationId];
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          contextualizations,
          lastUpdateAt: payload.lastUpdateAt,
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
          },
          lastUpdateAt: payload.lastUpdateAt,
        }
      };
    case DELETE_CONTEXTUALIZER:
      contextualizers = {...state[payload.storyId].contextualizers};
      delete contextualizers[payload.contextualizerId];
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          contextualizers,
          lastUpdateAt: payload.lastUpdateAt,
        }
      };
    case SET_COVER_IMAGE:
      return {
        ...state,
        [payload.storyId]: {
          ...state[payload.storyId],
          metadata: {
            ...state[payload.storyId].metadata,
            coverImage: {
              resourceId: payload.resourceId
            }
          },
          lastUpdateAt: payload.lastUpdateAt,
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