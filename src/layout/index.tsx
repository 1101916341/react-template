import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useHistory } from 'react-router-dom'
import { Layout } from 'antd'
import Nav from './Sider/Nav'
import './layout.less'
import Hamburger from '@components/Hamburger'
import LayoutContent from './Content'
import { getKeyName, isAuthorized } from '@/utils'
import { routeMap } from '@/routes/config'

const { Header } = Layout

const Main = (props: any) => {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [tabActiveKey, setTabActiveKey] = useState<string>('dashboard')
  const history = useHistory()
  const { pathname, search } = useLocation()
  const pathRef = useRef<string>('')
  const [panesItem, setPanesItem] = useState<any>({
    title: '',
    content: null,
    key: '',
    closable: false,
    path: ''
  })

  const handleResize = () => {
    document.documentElement.clientWidth < 768 ? setIsMobile(true) : setIsMobile(false)
  }

  // 检查权限
  const checkAuth = (newPathname: string): boolean => {
    // 不需要检查权限的
    if (['/', '/403', '/404'].includes(newPathname)) {
      return true
    }
    const { tabKey: currentKey } = getKeyName(newPathname)

    return isAuthorized(currentKey)
  }

  useEffect(() => {
    handleResize()
    window.onresize = handleResize
    return () => {
      window.onresize = null
    }
  }, [])

  // 判断当前页面
  useEffect(() => {
    const { tabKey, title, component: Content } = getKeyName(pathname)
    // 新tab已存在或不需要新建tab，return
    if (pathname === pathRef.current) {
      setTabActiveKey(tabKey)
      return
    }

    // 检查权限，比如直接从地址栏输入的，提示无权限
    const isHasAuth = checkAuth(pathname)
    if (!isHasAuth) {
      const isPath = routeMap.filter((item: { path: string | string[] }) => item.path.includes(pathname.split('?')[0]))
      const errorUrl: string = isPath.length > 0 ? '/403' : '/404'
      const { tabKey: errorKey, title: errorTitle, component: errorContent } = getKeyName(errorUrl)
      setPanesItem({
        title: errorTitle,
        content: errorContent,
        key: errorKey,
        closable: true,
        path: errorUrl
      })
      pathRef.current = errorUrl
      setTabActiveKey(errorKey)
      history.replace(errorUrl)
      return
    }

    // 记录新的路径，用于下次更新比较
    const newPath = search ? pathname + search : pathname

    pathRef.current = newPath
    setPanesItem({
      title,
      content: Content,
      key: tabKey,
      closable: tabKey !== 'dashboard',
      path: newPath
    })
    setTabActiveKey(tabKey)
  }, [history, pathname, search])

  return (
    <Layout>
      <Nav collapsed={collapsed} isMobile={isMobile} changeCollapsed={(broken: any) => setCollapsed(broken)} />
      <Layout className='site-layout'>
        <Header>
          <Hamburger collapsed={collapsed} setCollapsed={setCollapsed} />
        </Header>
        <Layout.Content>
          <LayoutContent defaultActiveKey='dashboard' panesItem={panesItem} tabActiveKey={tabActiveKey} />
        </Layout.Content>
      </Layout>
    </Layout>
  )
}

export default Main
