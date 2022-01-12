import { createStore, applyMiddleware, compose } from 'redux'
import { composeWithDevTools } from 'redux-devtools-extension'

// const store = createStore(rootReducer, composeEnhancers(applyMiddleware(epicMiddleware)))
const composeEnhancers = process.env.NODE_ENV !== 'production' ? composeWithDevTools({}) : compose
// epicMiddleware.run(rootEpic)

// export default store
