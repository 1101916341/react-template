import { Suspense } from 'react'
import { Provider } from 'react-redux'
import { ConfigProvider } from 'antd'
import Loading from './components/Loading'
import zhCN from 'antd/es/locale/zh_CN'
import Routes from './routes'
import store from './store'
import '@assets/css/index.less'

function App() {
  return (
    <Suspense fallback={<Loading hasSino={true} />}>
      <ConfigProvider locale={zhCN}>
        <Provider store={store}>
          <Routes />
        </Provider>
      </ConfigProvider>
    </Suspense>
  )
}

export default App
