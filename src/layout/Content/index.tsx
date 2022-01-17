import React, { useCallback } from 'react'
import { Layout } from 'antd'
import { connect } from 'react-redux'
import DocumentTitle from '@components/DocumentTitle' // 浏览器title
import { withRouter, Redirect, Route, Switch } from 'react-router-dom'
import { routeMap, Error404, Error403 } from '@routes/config/routeMap' // 路由跳转

const { Content } = Layout

const LayoutContent = React.memo((props: any) => {
  const { menuList, btnMenu = [] } = props

  /**
   * 工具 - 判断当前用户是否有该路由权限，如果没有就跳转至401页
   * @param pathname 路由路径
   * **/
  const checkRouterPower = useCallback(
    (pathname: string) => {
      if (menuList.length > 0) {
        const m: string[] = menuList.map((item: any) => item.url) // 当前用户拥有的所有菜单
        const btnM: string[] = btnMenu.map((item: any) => item.url) // 当前用户拥有的按钮权限
        let path = pathname.lastIndexOf('/')
        let pathUrl = pathname.substring(0, path)
        if (m.includes(pathname)) {
          // 菜单级别
          return true
        } else if (btnM.includes(pathUrl) && pathUrl) {
          // 按钮详情  编辑 级别
          return true
        } else if (btnM.includes(pathname) && pathUrl) {
          // 添加级别
          return true
        } else if (pathname === '/editPassowrd' || pathname === '/myUser' || pathname === '/loading') {
          // 固定属性
          return true
        }
      } else {
        return false
      }
    },
    [menuList, btnMenu]
  )

  // 切换路由时触发
  const onEnter = useCallback(
    (Component, props) => {
      /*
        检查当前用户是否有该路由页面的权限
        没有则跳转至403页
      */
      if (checkRouterPower(props.location.pathname)) {
        return <Component {...props} />
      } else {
        return <Redirect to='/error/403' />
      }
    },
    [checkRouterPower]
  )

  return (
    <DocumentTitle title={'测试'}>
      <Content className='layout-content'>
        <Switch>
          <Redirect exact from='/' to='/dashboard' />
          {/* 没有权限访问该页面 */}
          <Route exact component={Error403} path='/error/403' />
          {/* 默认没有该页面 */}
          {routeMap.map((route) => {
            return (
              <Route
                key={route.path}
                exact
                render={(props) => <>{onEnter(route.component, props)}</>}
                path={route.path}></Route>
            )
          })}
          <Route component={Error404} />
        </Switch>
      </Content>
    </DocumentTitle>
  )
})

function mapStateToProps(state: any) {
  return {
    menuList: state.loginReducer.menuList
  }
}

export default connect(mapStateToProps)(withRouter(LayoutContent))
