import React, { useCallback } from 'react'
import { Layout } from 'antd'
import { connect } from 'react-redux'
import DocumentTitle from '@components/DocumentTitle' // 浏览器title
import { withRouter, Redirect, Route, Switch } from 'react-router-dom'

const { Content } = Layout

const LayoutContent = React.memo((props: any) => {
  return (
    <DocumentTitle title={'测试'}>
      <Content className='layout-content'>
        <div>123</div>
        {/* <Switch> */}
        {/* <Redirect exact from='/' to='/dashboard' /> */}
        {/* 没有权限访问该页面 */}
        {/* </Switch> */}
      </Content>
    </DocumentTitle>
  )
})

export default LayoutContent
