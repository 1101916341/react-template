export const LOGIN_FETCH = 'LOGIN_FETCH'
export const LOGIN_FETCH_SUC = 'LOGIN_FETCH_SUC'

export const LOGIN_USER_ALL_FETCH = 'LOGIN_USER_ALL_FETCH'
export const LOGIN_USER_ALL_FETCH_SUC = 'LOGIN_USER_ALL_FETCH_SUC'

// State
export interface loginState {
  username: string
  password: string
}

export interface loginSucState {
  token: string | any
}

// 用户信息
export interface userAllState {
  menuList: any[]
  roles: any[]
}

// Action
export interface LoginSucAction {
  type: typeof LOGIN_FETCH_SUC
  payload: loginSucState
}

export interface UserAllSucAction {
  type: typeof LOGIN_USER_ALL_FETCH_SUC
  payload: userAllState
}

export type LoginTypes = LoginSucAction | UserAllSucAction
