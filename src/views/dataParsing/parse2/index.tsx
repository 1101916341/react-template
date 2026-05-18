import React from 'react'
import { connect } from 'react-redux'

const Parse2 = () => {
  return <div>数据解析 - 解析2</div>
}

function mapStateToProps(state: any) {
  return {
    state: state
  }
}

export default connect(mapStateToProps, {})(Parse2)
