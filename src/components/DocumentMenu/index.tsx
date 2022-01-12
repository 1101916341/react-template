import React, { Fragment } from 'react'
import { Menu } from 'antd'
import { Link } from 'react-router-dom'
import { UserOutlined, VideoCameraOutlined, UploadOutlined } from '@ant-design/icons'

const DocumentMenu = (props: any) => {
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
      <Menu theme='dark' mode='inline' defaultSelectedKeys={['1']}>
        <Menu.Item key='1' icon={<UserOutlined />}>
          Index
        </Menu.Item>
        <Menu.Item key='2' icon={<VideoCameraOutlined />}>
          Tables
        </Menu.Item>
        <Menu.Item key='3' icon={<UploadOutlined />}>
          nav 3
        </Menu.Item>
      </Menu>
    </Fragment>
  )
}

export default DocumentMenu
