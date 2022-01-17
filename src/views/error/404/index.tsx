import React from 'react'
import { Result, Button } from 'antd'
import { connect } from 'react-redux'

const NotFound = (props: any) => {
  const { history, taglist, deleteTag } = props
  // 关闭时，清除缓存
  const goHome = () => {}
  return (
    <Result
      status='404'
      title='404'
      subTitle='抱歉，你访问的页面不存在!'
      extra={
        <Button onClick={goHome} ghost type='primary'>
          关闭当前页
        </Button>
      }
    />
  )
}
function mapStateToProps(state: any) {
  return {
    state: state
  }
}

export default connect(mapStateToProps, {})(NotFound)
