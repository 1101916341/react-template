import { routeMap } from '@routes/config'
// 获取当前页面的 页签属性
export const getPageTitle = (path: string) => {
  const newPath = path.split('?')[0]
  const title = '中后台管理系统模板' // 初始化标题
  const newTitle = routeMap.filter((item) => item.path === newPath).map((val) => `${title}-${val.name}`)[0]
  return newTitle ? newTitle : `${title}-暂无页面`
}
