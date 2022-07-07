import React from 'react'
import { menuRoute } from './menuRoute'
export const Error404 = React.lazy(() => import('@views/error/404'))
export const Error403 = React.lazy(() => import('@views/error/403'))
const Loading = React.lazy(() => import('@components/Loading'))

export const routeMap = [
  ...menuRoute,
  { path: '/error/404', name: '暂无页面', key: '404', component: Error404 },
  { path: '/error/403', name: '暂无权限', key: '403', component: Error403 },
  { path: '/loading', name: '', key: '', component: Loading }
]
