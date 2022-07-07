import { combineReducers } from 'redux'
import { loginReducer } from './login/loginReducer'
import { tagsReducer } from './tags/tagsReducer'

export const rootReducer = combineReducers({ loginReducer, tagsReducer })
