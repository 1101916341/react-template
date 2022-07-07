import React, { Fragment, useState, useCallback, FC, useMemo } from 'react'
import { Menu as MenuAntd } from 'antd'
import { Link, withRouter } from 'react-router-dom'
import { connect } from 'react-redux'
import logo from '@assets/images/logo.png'
import './DocumentMenu.less'

interface DocumentMenuTypes {
  collapsed: boolean
  menuList?: any[]
  history?: any
}

const DocumentMenu: FC<any> = (props: DocumentMenuTypes) => {
  const { menuList, history, collapsed } = props
  const [openKeys, setOpenKeys] = useState<Array<any>>([]) // 当前需要被展开的项
  const { Item, SubMenu } = MenuAntd

  // 工具 - 递归将扁平数据转换为层级数据
  const dataToJson = useCallback((one, data) => {
    let kids
    if (!one) {
      // 第1次递归
      kids = data.filter((item: any) => !item.parentId)
    } else {
      kids = data.filter((item: any) => item.parentId === one.id)
    }
    kids.forEach((item: { children: []; parentId: string; url: string }) =>
      !item.parentId && !item.url
        ? (item.children = dataToJson(item, data))
        : !item.url
        ? (item.children = dataToJson(item, data))
        : null
    )
    return kids.length ? kids : []
  }, [])

  // 构建树结构
  const makeTreeDom = useCallback(
    (data: any[]): JSX.Element[] => {
      return data.map((item: any) => {
        const { url, name, icon, id, children } = item
        const icons = <img src={require(`@assets/images/menu/${icon}`)} alt={icon} />
        if (children) {
          return (
            <SubMenu key={url ? url : id} icon={icon ? icons : null} title={name}>
              {makeTreeDom(children)}
            </SubMenu>
          )
        } else {
          return (
            <Item key={url ? url : id} icon={icon ? icons : null}>
              <Link to={url}>{name}</Link>
            </Item>
          )
        }
      })
    },
    [SubMenu, Item]
  )

  /** 处理原始数据，将原始数据处理为层级关系 **/
  const treeDom: JSX.Element[] = useMemo(() => {
    const sourceData: any[] = dataToJson(null, menuList) || []
    const treeDom = makeTreeDom(sourceData)
    return treeDom
  }, [menuList, dataToJson, makeTreeDom])

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
        {treeDom}
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
