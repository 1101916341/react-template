import React from 'react'
import './Loading.less'

interface LoadingType {
  hasSino?: boolean
}
const Loading = (props: LoadingType) => {
  const { hasSino } = props
  return (
    <div className={hasSino ? 'sino-loading sino-load' : 'sino-loading sino-render'}>
      <div className='sino-default-loading'>
        <span>Loading...</span>
      </div>
    </div>
  )
}
export default Loading
