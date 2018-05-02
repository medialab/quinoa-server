const initialStoriesState = {};

export const ACTIVATE_STORY = 'ACTIVATE_STORY';
export const DELETE_STORY = 'DELETE_STORY';

export default function stories(state = initialStoriesState, action) {
  const {payload, socket} = action;
  switch (action.type) {
    case ACTIVATE_STORY:
      return {
        ...state,
        [payload.id]: payload
      }
    default:
      return state;
  }
}