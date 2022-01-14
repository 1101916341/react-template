import { LOGIN_FETCH_SUC, LoginTypes, loginSucState } from './types'
import { getToken, setToken } from '@/utils/auth'

const loginSucInit: loginSucState = {
  token: getToken()
}

export const loginReducer = (state = loginSucInit, action: LoginTypes) => {
  switch (action.type) {
    case LOGIN_FETCH_SUC:
      setToken(JSON.stringify(action.payload))
      return {
        ...state,
        token: action.payload.token
      }
    default:
      return state
  }
}
