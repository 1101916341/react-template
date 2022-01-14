import { LOGIN_FETCH_SUC, LoginTypes, loginSucState, LOGIN_USER_ALL_FETCH_SUC } from './types'
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
    case LOGIN_USER_ALL_FETCH_SUC:
      return {
        ...state,
        menuList: action.payload.menuList,
        roles: action.payload.roles
      }
    default:
      return state
  }
}
