import { request } from '@/utils/request'

export const api = {
  login: '/admin/user/login',
  loginUserAll: '/admin/user/getUserAll'
}

export function loginApi(data: any) {
  return request({
    url: api.login,
    method: 'POST',
    params: data
  })
}

export function loginUserAllApi() {
  return request({
    url: api.loginUserAll,
    method: 'GET'
  })
}
