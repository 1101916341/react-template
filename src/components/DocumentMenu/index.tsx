import React, { Fragment, useState, useCallback } from 'react'
import { Menu as MenuAntd } from 'antd'
import { Link, withRouter } from 'react-router-dom'
import { HomeOutlined } from '@ant-design/icons'
import { connect } from 'react-redux'

const DocumentMenu = (props: any) => {
  const { menuList, history } = props
  const [openKeys, setOpenKeys] = useState<Array<any>>([]) // 当前需要被展开的项
  const { Item } = MenuAntd

  // 菜单被选择
  const onSelect = useCallback((e) => {
    if (!e.key) e.key = '/dashboard'
  }, [])

  return (
    <Fragment>
      <div className='sidebar-logo-container'>
        图标
        {/* <Link to='/dashboard'>
          {sidebarCollapsed ? (
            <img src={logoIcon} className='sidebar-logo small-logo' alt='logoIcon' />
          ) : (
            <img src={logo} className='sidebar-logo big-logo' alt='logo' />
          )}
        </Link> */}
      </div>
      <MenuAntd
        theme='dark'
        mode='inline'
        selectedKeys={history.location.pathname}
        defaultOpenKeys={openKeys}
        onSelect={onSelect}>
        {menuList.map((item: any) => {
          const { url, name, icon, id } = item
          const icons = <img src={require(`@assets/images/${icon}`)} alt={icon} />
          return (
            <Item key={id} icon={icon ? icons : <HomeOutlined />}>
              <Link to={url}>
                <span>{name}</span>
              </Link>
            </Item>
          )
        })}
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
