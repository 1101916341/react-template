import { LOGIN_FETCH, LOGIN_FETCH_SUC } from './types'
import { Epic, ofType } from 'redux-observable'
import { from, map, switchMap } from 'rxjs'
import { loginApi } from '@/api/login'
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
              message.success(data.message)
              return {
                type: LOGIN_FETCH_SUC,
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
