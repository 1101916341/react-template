import { Card } from 'antd'
import React from 'react'

import { connect } from 'react-redux'

const Dashboard = (props: any) => {
  const { history, taglist, deleteTag } = props

  return (
    <Card className='card' title='首页'>
      首页
    </Card>
  )
}
function mapStateToProps(state: any) {
  return {
    state: state
  }
}

export default connect(mapStateToProps, {})(Dashboard)
