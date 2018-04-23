const initialStoriesState = {};

export const CREATE_STORY = 'CREATE_STORY';
export const DELETE_STORY = 'DELETE_STORY';

export default function stories(state = initialStoriesState, action) {
  const {payload, socket} = action;
  switch (action.type) {
    case `${CREATE_STORY}_SUCCESS`:
      return {
        ...state,
        [payload.id]: payload
      }
    default:
      return state;
  }
}