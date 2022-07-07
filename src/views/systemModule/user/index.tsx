import React from 'react'
import { Result, Button } from 'antd'

import { connect } from 'react-redux'

const Users = (props: any) => {
  const { history, taglist, deleteTag } = props

  return <div>用户管理</div>
}
function mapStateToProps(state: any) {
  return {
    state: state
  }
}

export default connect(mapStateToProps, {})(Users)
