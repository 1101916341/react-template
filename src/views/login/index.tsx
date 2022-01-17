import React, { FC, useEffect } from 'react'
import DocumentTitle from '@/components/DocumentTitle'
import Logo from '@/assets/images/logo.png'
import ReactCanvasNest from 'react-canvas-nest'
import { Form, Input, Button } from 'antd'
import { LockOutlined, UserOutlined } from '@ant-design/icons'
import { connect } from 'react-redux'
import { loginAction, logOutSucAction } from '@store/login/loginAction'
import './login.less'
import { useHistory } from 'react-router-dom'
import { removeToken } from '@/utils/auth'

const Login: FC = (props: any) => {
  const { loginAction, token, logOutSucAction } = props
  const floatColor = token ? '110,65,255' : '24,144,255'
  const history = useHistory()

  useEffect(() => {
    if (token) {
      history.push('/')
    } else {
      logOutSucAction()
      removeToken()
    }
  }, [token, history, logOutSucAction])

  // 用户登录
  const onFinish = (value) => loginAction(value)

  return (
    <DocumentTitle title='用户登录'>
      <div className='login-layout' id='login-layout'>
        <ReactCanvasNest
          config={{
            pointColor: floatColor,
            lineColor: floatColor,
            pointOpacity: 0.6
          }}
          style={{ zIndex: 1 }}
        />
        <div className='logo-box'>
          <img alt='' className='logo' src={Logo} />
          <span className='logo-name'>管理系统模板</span>
        </div>
        <Form className='login-form' name='login-form' onFinish={onFinish}>
          <Form.Item name='userName' rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder='用户名' prefix={<UserOutlined />} size='large' />
          </Form.Item>
          <Form.Item
            name='password'
            rules={[{ required: true, message: '请输入密码' }]}
            extra='用户名：admin 密码：123456'>
            <Input.Password placeholder='密码' autoComplete='off' prefix={<LockOutlined />} size='large' />
          </Form.Item>
          <Form.Item>
            <Button className='login-form-button' htmlType='submit' size='large' type='primary'>
              登录
            </Button>
          </Form.Item>
        </Form>
      </div>
    </DocumentTitle>
  )
}

function mapStateToProps(state: any) {
  return {
    token: state.loginReducer.token
  }
}
export default connect(mapStateToProps, { loginAction, logOutSucAction })(Login)
