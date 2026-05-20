import React, { Fragment, useState, useCallback, FC, useMemo } from 'react'
import { Menu as MenuAntd } from 'antd'
import { Link, withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import logo from '@assets/images/logo.png'
import './DocumentMenu.less'
import { routeMap } from '@/routes/config'

interface DocumentMenuTypes {
  collapsed: boolean
  menuList?: any[]
  history?: any
}

const DocumentMenu: FC<any> = (props: DocumentMenuTypes) => {
  const { menuList, history, collapsed } = props
  const [openKeys, setOpenKeys] = useState<Array<any>>([]) // 当前需要被展开的项
  const { Item, SubMenu } = MenuAntd

  const makeTreeDom = useCallback(
    (data: any[]): JSX.Element[] => {
      return data
        .filter((v) => v.isShow)
        .map((item: any) => {
          const { path, name, id, children } = item
          if (children && children.length > 0) {
            return (
              <SubMenu key={path ? path : id} title={name}>
                {makeTreeDom(children)}
              </SubMenu>
            )
          }
          return (
            <Item key={path ? path : id}>
              <Link to={path}>{name}</Link>
            </Item>
          )
        })
    },
    [SubMenu, Item]
  )

  /** 处理原始数据，将原始数据处理为层级关系 **/
  const treeDom: JSX.Element[] = useMemo(() => {
    const sourceData: any[] = routeMap || []
    return makeTreeDom(sourceData)
  }, [routeMap, makeTreeDom])

  return (
    <Fragment>
      <Link to='/dashboard'>
        {collapsed ? (
          <div className='sidebar-logo-container sidebar-small'>
            <img src={logo} className='small-logo' alt='logo' title='首页' />
          </div>
        ) : (
          <div className='sidebar-logo-container sidebar-log'>
            <img src={logo} className='big-logo' alt='logo' title='首页' />
            <span>中后台管理系统模板</span>
          </div>
        )}
      </Link>
      <MenuAntd theme='dark' mode='inline' selectedKeys={[history.location.pathname]} defaultOpenKeys={openKeys}>
        {makeTreeDom(routeMap)} {/* 生成树结构的菜单项 */}
      </MenuAntd>
    </Fragment>
  )
}

function mapStateToProps(state: any) {
  return {
    menuList: state.loginReducer.menuList
  }
}

export default connect(mapStateToProps, {})(withRouter(DocumentMenu))
