import Cookies from 'js-cookie'

const TokenKey = 'loginAuthToken'

export function getToken() {
  const token: string | any = Cookies.get(TokenKey)
  return token ? JSON.parse(token).token : ''
}

export function setToken(token: any) {
  return Cookies.set(TokenKey, token, { expires: 7 })
}

export function removeToken() {
  return Cookies.remove(TokenKey)
}
