import React from 'react'
import { Result, Button } from 'antd'

import { connect } from 'react-redux'

const NoPower = (props: any) => {
  const { history, taglist, deleteTag } = props

  const goHome = () => {}
  return (
    <Result
      status='403'
      title='403'
      subTitle='抱歉，你没有访问该页面的权限!'
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

export default connect(mapStateToProps, {})(NoPower)
