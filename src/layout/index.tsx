import React, { useState, useEffect } from 'react'
import { Layout } from 'antd'
import Nav from './Sider/Nav'
import './layout.less'
import Hamburger from '@components/Hamburger'

const { Header, Content } = Layout

const Main = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const handleResize = () => {
    document.documentElement.clientWidth < 768 ? setIsMobile(true) : setIsMobile(false)
  }

  useEffect(() => {
    handleResize()
    window.onresize = handleResize
    return () => {
      window.onresize = null
    }
  }, [])

  return (
    <Layout>
      <Nav collapsed={collapsed} isMobile={isMobile} changeCollapsed={(broken: any) => setCollapsed(broken)} />
      <Layout className='site-layout'>
        <Header style={{ padding: 0, backgroundColor: '#ffffff' }}>
          <Hamburger collapsed={collapsed} setCollapsed={setCollapsed} />
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            backgroundColor: '#ffffff'
          }}></Content>
      </Layout>
    </Layout>
  )
}
export default Main
