import axios from 'axios'
import store from '../store'

// export const url: string = window.location.href.split('/#')[0]

axios.defaults.headers['Access-Control-Allow-Origin'] = process.env.REACT_APP_API_URL
axios.defaults.headers['Access-Control-Allow-Credentials'] = true
axios.defaults.headers['x-requested-with'] = 'XMLHttpRequest'
axios.defaults.headers['Content-Security-Policy'] = 'upgrade-insecure-requests'
axios.defaults.headers['Cross-Origin-Embedder-Policy'] = 'require-corp'
axios.defaults.headers['Cross-Origin-Opener-Policy'] = 'same-origin'

// 创建axios实例
const request = axios.create({
  headers: {
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, PUT, DELETE, OPTIONS'
  },
  baseURL: process.env.REACT_APP_API_URL,
  timeout: 200000
})

// 请求拦截器
request.interceptors.request.use(
  (config: any) => {
    // 在发出请求前做点什么
    if (store.getState().loginReducer['token']) {
      // 让每个请求携带token-- ['Authorization']为自定义key 请根据实际情况自行修改
      // config.headers['Authorization'] = store.getState().loginReducer['token']
      
      // 终止请求
      // cancelPending(config)
      // config.cancelToken = new cancelToken((fnc) => {
      //   pending.push({ url: config.url, function: fnc })
      // })
    }
    return config
  },
  (error) => {
    // 处理请求错误
    console.log(error) // 用于调试
    Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: any) => {
    // if (response.data.resultCode === 500) {
    //   //   message.error(response.data.resultMessage)
    // } else if (response.data.code === 401 || response.data.code === 403) {
    //   // 抛出401错误，因为token失效，重新刷新页面，清空缓存，跳转到登录界面
    //   //   message.error('身份令牌失效，请重新登录！')
    //   console.log('退出登录')
    // } else if (response.data.code === '200') {
    //   // 删除session信息 退出登录 或者 被顶
    //   //   notification.warning({
    //   //     key: 'logout', // 只弹出一次，不会重复弹出多个
    //   //     message: '账户异常',
    //   //     description: '账号登录超时，请重新登录！'
    //   //     // description: '账号已在其他设备登录，请重新登录! \n 如非本人操作，建议尽快修改密码！'
    //   //   })

    //   return '200'
    // } else {
    //   cancelPending(response.config)
    return response
    // }
  },
  (error) => {
    if (error && error.message === '取消请求') {
      return error.message
    } else {
      Promise.reject(error)
    }
  }
)

export { request }
