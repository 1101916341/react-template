import React from 'react'

import { connect } from 'react-redux'

const Dashboard = (props: any) => {
  const { history, taglist, deleteTag } = props

  return <div>首页</div>
}
function mapStateToProps(state: any) {
  return {
    state: state
  }
}

export default connect(mapStateToProps, {})(Dashboard)
