import { LOGIN_FETCH, LOGIN_FETCH_SUC, LOGIN_USER_ALL_FETCH, LOGIN_USER_ALL_FETCH_SUC } from './types'
import { Epic, ofType } from 'redux-observable'
import { from, map, switchMap } from 'rxjs'
import { loginApi, loginUserAllApi } from '@/api/login'
import { message } from 'antd'

export const loginEpic: Epic = (action$) =>
  action$.pipe(
    ofType(LOGIN_FETCH),
    switchMap((action) =>
      from(loginApi(action.payload)).pipe(
        map((response: any) => {
          if (response) {
            const { data } = response
            if (data && data.code === '200') {
              if (action.payload.userName === 'admin' && action.payload.password === '123456') {
                message.success(data.message)
                return {
                  type: LOGIN_FETCH_SUC,
                  payload: data
                }
              } else if (action.payload.userName !== 'admin') {
                message.error('用户名不存在，请重新输入！')
                return { type: null }
              } else {
                message.error('用户名或密码错误！')
                return { type: null }
              }
            } else {
              message.error('用户名或密码错误！')
              return { type: null }
            }
          } else {
            return { type: null }
          }
        })
      )
    )
  )

// 登录用户信息
export const loginUserAllEpic: Epic = (action$) =>
  action$.pipe(
    ofType(LOGIN_USER_ALL_FETCH),
    switchMap(() =>
      from(loginUserAllApi()).pipe(
        map((response: any) => {
          if (response) {
            const { data } = response
            if (data && data.code === '200') {
              return {
                type: LOGIN_USER_ALL_FETCH_SUC,
                payload: data
              }
            } else {
              return { type: null }
            }
          } else {
            return { type: null }
          }
        })
      )
    )
  )
