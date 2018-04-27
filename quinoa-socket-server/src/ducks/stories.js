const initialStoriesState = {};

export const UPDATE_STORY = 'UPDATE_STORY';
export const DELETE_STORY = 'DELETE_STORY';

export default function stories(state = initialStoriesState, action) {
  const {payload, socket} = action;
  switch (action.type) {
    case UPDATE_STORY:
      return {
        ...state,
        [payload.id]: payload
      }
    default:
      return state;
  }
}