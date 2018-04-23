import {register, login, verifyToken} from '../controllers/auth';

const createStory = (action) => ({
  ...action,
  promise: () => {
    return new Promise ((resolve, reject) => {
      const {payload, password} = action;
      return register(payload.id, password)
             .then(res => resolve(res))
             .catch(err => reject(err))
    })
  }
})

const loginStory = (action) => ({
  ...action,
  promise: () => {
    return new Promise ((resolve, reject) => {
      const {payload} = action;
      return login(payload.storyId, payload.password)
             .then(res => resolve(res))
             .catch(err => reject(err))

    })
  }
})

const enterStory = (action) => ({
  ...action,
  promise: () => {
    return new Promise ((resolve, reject) => {
      const {payload} = action;
      return verifyToken(payload.token)
             .then(res => resolve(res))
             .catch(err => reject(err))
    })
  }
})

module.exports = {
  "CREATE_STORY": createStory,
  "LOGIN_STORY": loginStory,
  "ENTER_STORY": enterStory,
}