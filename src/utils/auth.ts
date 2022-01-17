import Cookies from 'js-cookie'

const TokenKey = 'loginAuthToken'

export function getToken() {
  const token: string | any = Cookies.get(TokenKey)
  return token && token === '成功￥进入%' ? token : ''
}

export function setToken(token: any) {
  return Cookies.set(TokenKey, token, { expires: 3 })
}

export function removeToken() {
  return Cookies.remove(TokenKey)
}
