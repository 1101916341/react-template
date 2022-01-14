import { LOGIN_FETCH, loginState } from './types'

export const loginInit: loginState = {
  username: '',
  password: ''
}

// 登录
export const loginAction = (value: loginState) => ({
  type: LOGIN_FETCH,
  payload: value
})
