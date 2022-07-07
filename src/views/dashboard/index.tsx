import React from 'react'
import { Card } from 'antd'
import { connect } from 'react-redux'

const Dashboard = (props: any) => {
  const { history, taglist, deleteTag } = props

  return (
    <Card className='card' title='首页'>
      首页
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
      <p>首页</p>
    </Card>
  )
}
function mapStateToProps(state: any) {
  return {
    state: state
  }
}

export default connect(mapStateToProps, {})(Dashboard)
