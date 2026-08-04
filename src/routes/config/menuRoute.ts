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
const DataParse1Menu = lazy(
  () => import('@views/dataParsing/parse1')
  // 数据解析 - 解析1
)
const DataParse2Menu = lazy(
  () => import('@views/dataParsing/parse2')
  // 数据解析 - 解析2
)
const DataParse3Menu = lazy(
  () => import('@views/dataParsing/parse3')
  // 数据解析 - 解析3
)
const DataParse4Menu = lazy(
  () => import('@views/dataParsing/parse4')
  // 数据解析 - 解析4
)

export const menuRoute = [
  {
    path: '/dashboard',
    name: '首页',
    key: 'dashboard',
    component: HomeMenu,
    isShow: true // 首页菜单
  },
  {
    name: '系统管理',
    key: 'system:manage',
    isShow: true,
    children: [
      {
        path: '/system/user',
        name: '用户列表',
        key: 'user:list:view',
        component: UsersMenu,
        isShow: true // 用户管理
      },
      {
        path: '/system/role',
        name: '角色列表',
        key: 'role:list:view',
        component: RolesMenu,
        isShow: true // 角色管理
      }
    ]
  },
  {
    name: '数据解析',
    key: 'data:parsing',
    isShow: true,
    children: [
      {
        path: '/data/parse1',
        name: '解析1',
        key: 'data:parse1:view',
        component: DataParse1Menu,
        isShow: true
      },
      {
        path: '/data/parse2',
        name: '解析2',
        key: 'data:parse2:view',
        component: DataParse2Menu,
        isShow: true
      },
      {
        path: '/data/parse3',
        name: '解析3',
        key: 'data:parse3:view',
        component: DataParse3Menu,
        isShow: true
      },
      {
        path: '/data/parse4',
        name: '解析4',
        key: 'data:parse4:view',
        component: DataParse4Menu,
        isShow: true
      }
    ]
  }
]
