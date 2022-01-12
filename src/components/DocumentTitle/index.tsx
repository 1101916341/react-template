import React, { useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'

interface DocumentTitleTypes {
  title: string
  children?: any
}

const DocumentTitle = (props: DocumentTitleTypes) => {
  const { title } = props

  const handleHeaderTitle = useCallback(() => {
    document.title = title
  }, [title])

  useEffect(() => {
    handleHeaderTitle()
    return () => {
      handleHeaderTitle()
    }
  }, [handleHeaderTitle])

  return React.Children.only(props.children)
}

DocumentTitle.propTypes = {
  title: PropTypes.string.isRequired
}

export default DocumentTitle
