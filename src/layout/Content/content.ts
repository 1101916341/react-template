import { routeMap } from '@routes/config'

const flattenRouteMap = (routes: any[] = []) => {
  return routes.reduce((result: any[], route: any) => {
    if (route.path) {
      result.push(route)
    }
    if (route.children && route.children.length > 0) {
      result.push(...flattenRouteMap(route.children))
    }
    return result
  }, [])
}

// 获取当前页面的 页签属性
export const getPageTitle = (path: string) => {
  const newPath = path.split('?')[0]
  const title = '中后台管理系统模板' // 初始化标题
  const flatRoutes = flattenRouteMap(routeMap)
  const newTitle = flatRoutes.filter((item) => item.path === newPath).map((val) => `${title}-${val.name}`)[0]
  return newTitle ? newTitle : `${title}-暂无页面`
}
