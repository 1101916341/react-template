import { request } from '@/utils/request'

export const api = {
  login: '/admin/user/login',
  getUserAll: '/admin/user/getUserAll'
}

export function loginApi(data: any) {
  return request({
    url: api.login,
    method: 'POST',
    params: data
  })
}

export function getUserAllApi() {
  return request({
    url: api.getUserAll,
    method: 'GET'
  })
}
