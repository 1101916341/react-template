import { LOGIN_FETCH, loginState, LOGIN_USER_ALL_FETCH } from './types'

export const loginInit: loginState = {
  username: '',
  password: ''
}

// 登录
export const loginAction = (value: loginState) => ({
  type: LOGIN_FETCH,
  payload: value
})

// 用户信息
export const loginUserAllAction = () => ({ type: LOGIN_USER_ALL_FETCH })
