import React from 'react'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import './hamburger.less'

const Hamburger = React.memo((props: any) => {
  const { collapsed, setCollapsed } = props

  return (
    <div className='hamburger-container' onClick={() => setCollapsed(!collapsed)}>
      {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
    </div>
  )
})

Hamburger.displayName = 'Hamburger'

export default Hamburger
