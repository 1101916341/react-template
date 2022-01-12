import React, { Fragment } from 'react'
import { Drawer, Layout } from 'antd'
import PropTypes from 'prop-types'
import DocumentMenu from '@/components/DocumentMenu'

const { Sider } = Layout

interface NavTypes {
  isMobile: boolean
  collapsed: boolean
  changeCollapsed: Function
  width?: number
}

const Nav = ({ isMobile, collapsed, changeCollapsed, width = 256 }: NavTypes) => {
  return (
    <Fragment>
      {!isMobile ? (
        <Sider
          collapsible
          trigger={null}
          collapsed={collapsed}
          width={width}
          onBreakpoint={(broken) => changeCollapsed(broken)}
          breakpoint='xl'
          style={{
            height: '100vh'
          }}>
          <DocumentMenu />
        </Sider>
      ) : (
        <Drawer
          width={256}
          placement='left'
          onClose={() => {
            changeCollapsed(!0)
          }}
          visible={!collapsed}
          closable={false}
          bodyStyle={{
            height: '100vh',
            padding: 0
          }}>
          <Sider
            width={width}
            style={{
              height: '100vh'
            }}>
            <DocumentMenu />
          </Sider>
        </Drawer>
      )}
    </Fragment>
  )
}

Nav.propTypes = {
  isMobile: PropTypes.bool.isRequired,
  collapsed: PropTypes.bool.isRequired,
  changeCollapsed: PropTypes.func.isRequired,
  width: PropTypes.number
}

export default Nav
