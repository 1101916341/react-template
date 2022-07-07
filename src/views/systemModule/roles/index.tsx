import React from 'react'
import { Result, Button } from 'antd'

import { connect } from 'react-redux'

const Roles = (props: any) => {
  const { history, taglist, deleteTag } = props

  return <div>角色管理</div>
}
function mapStateToProps(state: any) {
  return {
    state: state
  }
}

export default connect(mapStateToProps, {})(Roles)
