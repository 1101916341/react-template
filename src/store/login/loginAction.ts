import { LOGIN_FETCH, loginState, LOGIN_USER_ALL_FETCH, LOG_OUT_FETCH_SUC } from './types'

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

// 用户退出登录
export const logOutSucAction = () => ({ type: LOG_OUT_FETCH_SUC })
