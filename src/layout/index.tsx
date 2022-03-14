import React, { useState, useEffect, Component } from 'react'
import { Layout } from 'antd'
import Nav from './Sider/Nav'
import './layout.less'
import Hamburger from '@components/Hamburger'
import LayoutContent from './Content'

const { Header } = Layout

interface PanesItemProps {
  title: string
  content: Component | any
  key: string
  closable: boolean
  path: string
}

const Main = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  const [tabActiveKey, setTabActiveKey] = useState<string>('home')
  const [panesItem, setPanesItem] = useState<PanesItemProps>({
    title: '',
    content: null,
    key: '',
    closable: false,
    path: ''
  })

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
        <Header style={{ padding: '0px 16px', backgroundColor: '#ffffff' }}>
          <Hamburger collapsed={collapsed} setCollapsed={setCollapsed} />
        </Header>
        <Layout.Content>
          <LayoutContent />
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
export default Main
