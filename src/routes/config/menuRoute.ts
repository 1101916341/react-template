import { lazy } from 'react'

const HomeMenu = lazy(() => import('@views/dashboard')) // 首页菜单

// const ConfigureMenu = lazy(
//   () => import('@/layout/Sider/Menu/SonMenu/ConfigureMenu')
//   // 配置管理
// )
// const NewsMenu = lazy(
//   () => import('@/layout/Sider/Menu/SonMenu/NewsMenu')
//   // 消息管理
// )
// const SystemMenu = lazy(
//   () => import('@/layout/Sider/Menu/SonMenu/SystemMenu')
//   // 系统管理
// )

export const menuRoute = [
  {
    path: '/dashboard',
    component: HomeMenu // 首页菜单
  }
  //   {
  //     path: '/configure',
  //     component: ConfigureMenu // 配置管理
  //   },
  //   {
  //     path: '/system',
  //     component: SystemMenu // 系统管理
  //   },
  //   {
  //     path: '/news',
  //     component: NewsMenu // 消息管理
  //   }
]
