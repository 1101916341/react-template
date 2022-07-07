import dayjs from 'dayjs'
import NotFound from '@views/error/404'
import { routeMap } from '@routes/config'

// 单个 去除首尾空格
export function myTrim(x: string): string {
  return x ? x.replace(/^\s+|\s+$/gm, '') : ''
}

// string类型 去前后空格
export function myTrimAllMethod(value: any) {
  for (const i in value) {
    if (value[i] && typeof value[i] === 'string') {
      value[i] = myTrim(value[i])
    }
  }
  return value
}

// 日期转换格式
export function setTimeMethod(value, date: any) {
  for (const key in date) {
    if (date[key]) {
      if (date[key] && date[key]._d) {
        value[key] = dayjs(date[key]._d).format('YYYY-MM-DD')
      } else if (date[key]) {
        value[key] = date[key]
      } else {
        value[key] = ''
      }
    }
  }
  return value
}

/**
 * 根据路径获取路由的name和key
 * @param {string} path 路由
 */
export const getKeyName = (path: string = '/403') => {
  const truePath = path.split('?')[0]
  const curRoute = routeMap.filter((item: { path: string | string[] }) => item.path.includes(truePath))
  if (curRoute[0]) {
    const { name, key, component } = curRoute[0]
    return { title: name, tabKey: key, component: component }
  } else {
    return { title: '暂无页面', tabKey: '404', component: NotFound }
  }
}

/**
 * 获取本地存储中的权限
 */
export const getPermission = () => localStorage.getItem('permissions') || ''
/**
 * 根据权限判断是否有权限
 */
export const isAuthorized = (val: string): boolean => {
  const permissions = getPermission()
  return permissions.includes(val)
}
/**
 * 处理用户信息并储存起来
 */
export const setUserInfo = (userInfo) => {
  const { menuList } = userInfo
  const permissionArray = menuList.filter((item) => item.code).map((val) => val.code)
  localStorage.setItem('permissions', permissionArray)
}

/**
 * 深拷贝
 * @param {Object} obj  要拷贝的对象
 *
 */
export const deepClone = (obj: any = {}) => {
  if (typeof obj !== 'object' || obj == null) {
    return obj
  }
  let result: any
  if (obj instanceof Array) {
    result = []
  } else {
    result = {}
  }
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = deepClone(obj[key])
    }
  }
  return result
}
