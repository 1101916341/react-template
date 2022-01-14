import { createStore, applyMiddleware, compose } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'
import { createEpicMiddleware } from 'redux-observable'
import { rootReducer } from './reducer'
import { rootEpic } from './epic'

const epicMiddleware = createEpicMiddleware()

const composeEnhancers = process.env.NODE_ENV !== 'production' ? composeWithDevTools({}) : compose

const store = createStore(rootReducer, composeEnhancers(applyMiddleware(epicMiddleware)))
epicMiddleware.run(rootEpic)

export default store
