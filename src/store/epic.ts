import { combineEpics } from 'redux-observable'
import { loginEpic, loginUserAllEpic } from './login/loginEpic'

export const rootEpic = combineEpics(loginEpic, loginUserAllEpic)
