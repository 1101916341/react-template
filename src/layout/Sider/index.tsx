import React, { useEffect, useState } from 'react'
import Nav from './Nav'

const LayoutSider = React.memo(() => {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const handleResize = () => {
    document.documentElement.clientWidth < 768 ? setIsMobile(true) : setIsMobile(false)
  }
  useEffect(() => {
    handleResize()
    window.onresize = handleResize
    return () => {
      window.onresize = null
    }
  }, [])
  return <Nav collapsed={collapsed} isMobile={isMobile} changeCollapsed={(broken: any) => setCollapsed(broken)} />
})

export default LayoutSider
