import { lazy } from 'react'

const HomeMenu = lazy(() => import('@views/dashboard')) // 首页菜单

const UsersMenu = lazy(
  () => import('@views/systemModule/user')
  // 用户管理
)
const RolesMenu = lazy(
  () => import('@views/systemModule/roles')
  // 角色管理
)
// const SystemMenu = lazy(
//   () => import('@/layout/Sider/Menu/SonMenu/SystemMenu')
//   // 系统管理
// )

export const menuRoute = [
  {
    path: '/dashboard',
    name: '首页',
    key: 'dashboard',
    component: HomeMenu // 首页菜单
  },
  {
    path: '/system/user',
    name: '用户列表',
    key: 'user:list:view',
    component: UsersMenu // 用户管理
  },
  {
    path: '/system/role',
    name: '角色列表',
    key: 'role:list:view',
    component: RolesMenu // 角色管理
  }
  //   {
  //     path: '/news',
  //     component: NewsMenu // 消息管理
  //   }
]
