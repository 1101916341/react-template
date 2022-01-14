import { combineEpics } from 'redux-observable'
import { loginEpic } from './login/loginEpic'

export const rootEpic = combineEpics(loginEpic)
