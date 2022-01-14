export const LOGIN_FETCH = 'LOGIN_FETCH'
export const LOGIN_FETCH_SUC = 'LOGIN_FETCH_SUC'

// State
export interface loginState {
  username: string
  password: string
}

export interface loginSucState {
  token: string | any
}

// Action
export interface LoginSucAction {
  type: typeof LOGIN_FETCH_SUC
  payload: loginSucState
}

export type LoginTypes = LoginSucAction
