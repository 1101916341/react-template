import React, { useEffect, useState, useRef } from 'react'
import { Dropdown, Layout, Tabs, Menu } from 'antd'
import { connect } from 'react-redux'
import DocumentTitle from '@components/DocumentTitle' // 浏览器title
import { useHistory, useLocation } from 'react-router-dom'
import { SyncOutlined } from '@ant-design/icons'
import Dashboard from '@views/dashboard'
import Loading from '@/components/Loading'
import { getPageTitle } from './content'
import { getKeyName, isAuthorized } from '@/utils'
import { tagAddFnc, tagDelFnc, tagUpdateFnc } from '@store/tags/tagsAction'

const { Content } = Layout
const { TabPane } = Tabs

const LayoutContent = React.memo((props: any) => {
  const { defaultActiveKey, panesItem, tabActiveKey, tagAddFnc, tagDelFnc, tagUpdateFnc, menuPane } = props

  const [activeKey, setActiveKey] = useState<string>('dashboard') // 默认选中的页签
  const [isReload, setIsReload] = useState<boolean>(false)
  const [selectedPanel, setSelectedPanel] = useState<any>({})
  const { pathname, search } = useLocation()
  const history = useHistory()
  const fullPath = pathname + search
  const pathRef = useRef<string>('')

  // 初始化加载页面
  useEffect(() => {
    const newPath = pathname + search
    // 当前的路由和上一次的一样，return
    if (!panesItem.path || panesItem.path === pathRef.current) return

    // 保存这次的路由地址
    pathRef.current = newPath

    const index = menuPane.findIndex((_) => _.key === panesItem.key)
    // 无效的新tab，return
    if (!panesItem.key || (index > -1 && newPath === menuPane[index].path)) {
      setActiveKey(tabActiveKey)
      return
    }
    // 新tab已存在，重新覆盖掉（解决带参数地址数据错乱问题）
    if (index > -1) {
      menuPane[index].path = newPath
      setActiveKey(tabActiveKey)
      return
    }
    // 添加新tab并保存起来
    tagAddFnc(panesItem)
    setActiveKey(tabActiveKey)
  }, [tagAddFnc, menuPane, panesItem, pathname, search, tabActiveKey])

  // tab切换 以及页面跳转
  const onChange = (tabKey: string): void => {
    setActiveKey(tabKey)
    const { path } = menuPane.filter((item) => item.key === tabKey)[0]
    history.push({ pathname: path })
  }

  // 移除tab
  const remove = (targetKey: string): void => {
    // 删除对应的标签页
    tagDelFnc(targetKey)
    // 删除非当前tab
    if (targetKey !== activeKey) {
      const nextKey = activeKey
      setActiveKey(nextKey)
    } else {
      // 删除当前tab，地址往前推
      const nextPath = menuPane[menuPane.length - 2]?.path
      const { tabKey } = getKeyName(nextPath)
      // 如果当前tab关闭后，上一个tab无权限，就一起关掉
      if (!isAuthorized(tabKey) && nextPath !== '/') {
        remove(tabKey)
        history.push(menuPane[menuPane.length - 3].path)
      } else {
        history.push(nextPath)
      }
    }
  }

  // 判断是新增还是删除操作
  const onEdit = (targetKey: string | any, action: string) => action === 'remove' && remove(targetKey)

  // 阻止右键默认事件
  const handlePreventDefault = (e: Event | any, panel: object) => {
    e.preventDefault()
    setSelectedPanel(panel)
  }

  const handleRmoveAll = (isCloseAll?: boolean) => {
    const { path, key } = selectedPanel
    history.push(isCloseAll ? '/dashboard' : path)
    const homePanel = [
      {
        title: '首页',
        key: 'dashboard',
        content: Dashboard,
        closable: false,
        path: '/dashboard'
      }
    ]
    const nowPanes = key !== 'dashboard' && !isCloseAll ? [...homePanel, selectedPanel] : homePanel
    tagUpdateFnc({ menu: nowPanes })
    setActiveKey(isCloseAll ? 'dashboard' : key)
  }

  // 刷新当前 tab
  const refreshTab = (): void => {
    setIsReload(true)
  }

  const menu = (
    <Menu>
      <Menu.Item key='1' onClick={() => refreshTab()} disabled={selectedPanel.path !== fullPath}>
        刷新
      </Menu.Item>
      <Menu.Item
        key='2'
        onClick={(e) => {
          e.domEvent.stopPropagation()
          handleRmoveAll()
        }}>
        关闭其他
      </Menu.Item>
      <Menu.Item
        key='3'
        onClick={(e) => {
          e.domEvent.stopPropagation()
          handleRmoveAll(true)
        }}>
        关闭所有
      </Menu.Item>
    </Menu>
  )

  return (
    <DocumentTitle title={getPageTitle(pathname)}>
      <Content className='layout-content tabs-content' onContextMenu={(e) => e.preventDefault()}>
        <Tabs
          onEdit={onEdit}
          defaultActiveKey={defaultActiveKey}
          activeKey={activeKey}
          onChange={onChange}
          hideAdd
          type='editable-card'>
          {menuPane.map((pane: any) => (
            <TabPane
              tab={
                <Dropdown overlay={menu} trigger={['contextMenu']}>
                  <span onContextMenu={(e) => handlePreventDefault(e, pane)}>
                    {isReload && pane.path === fullPath && pane.path !== '/403' && (
                      <SyncOutlined title='刷新' spin={isReload} />
                    )}
                    {pane.title}
                  </span>
                </Dropdown>
              }
              closable={pane.closable}
              key={pane.key}>
              {pane.path ? <pane.content path={pane.path} /> : <Loading />}
            </TabPane>
          ))}
        </Tabs>
      </Content>
    </DocumentTitle>
  )
})

function mapStateToProps(state: any) {
  return {
    menuList: state.loginReducer.menuList,
    menuPane: state.tagsReducer
  }
}

export default connect(mapStateToProps, { tagAddFnc, tagDelFnc, tagUpdateFnc })(LayoutContent)
