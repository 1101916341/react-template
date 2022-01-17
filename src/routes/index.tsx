import React from 'react'
import { HashRouter as Router, Route, Switch, Redirect } from 'react-router-dom'
import { connect } from 'react-redux'
import Layout from '@/layout'
import Login from '@views/login'
import Loading from '@/components/Loading'
import { loginUserAllAction } from '@/store/login/loginAction'

interface RouteTypes {
  token?: string
  menuList?: any[]
  loginUserAllAction: Function
}

const Routes = React.memo((props: RouteTypes) => {
  const { token, menuList, loginUserAllAction } = props

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
                loginUserAllAction()
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
  return {
    token: state.loginReducer.token,
    menuList: state.loginReducer.menuList,
    roles: state.loginReducer.roles
  }
}

export default connect(mapStateToProps, { loginUserAllAction })(Routes)
