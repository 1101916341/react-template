import React from 'react'
import { HashRouter as Router, Route, Switch, Redirect } from 'react-router-dom'
import { connect } from 'react-redux'
import Layout from '@/layout'
import Login from '@views/login'
import Loading from '@/components/Loading'

interface RouteTypes {
  token?: string
  menuList?: any[]
}

const Routes = React.memo((props: RouteTypes) => {
  const { token, menuList } = props

  return (
    <Router>
      <Switch>
        <Route exact path='/login' component={Login} />
        <Route
          path='/'
          render={() => {
            if (token) {
              if (menuList && menuList.length > 0) {
                return <Layout />
              } else {
                // userInfo()
                return <Loading hasSino={true} />
              }
            } else {
              return <Redirect to='/login' />
            }
          }}
        />
      </Switch>
    </Router>
  )
})

function mapStateToProps(state: any) {
  return { token: state.loginReducer.token }
}

export default connect(mapStateToProps, {})(Routes)
