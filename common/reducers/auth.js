import {UPDATE_JWT} from 'src/common/actions/updateJWT'

const initialState = {
  currentUser: null,
  lgJWT: null,
  isBusy: false,
}

export function auth(state = initialState, action) {
  switch (action.type) {
    case UPDATE_JWT:
      return Object.assign({}, state, {
        lgJWT: action.lgJWT,
      })
    default:
      return state
  }
}
