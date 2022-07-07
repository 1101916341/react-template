import { TAG_ADD_FETCH, tagState, TAG_UPDATE_FETCH_SUC, TAG_DELETE_FETCH, TagsTypes } from './types'
import Dashboard from '@views/dashboard'

const tagInit: tagState = {
  title: '首页',
  key: 'dashboard',
  content: Dashboard,
  closable: false,
  path: '/dashboard'
}

export const tagsReducer = (state = [tagInit], action: TagsTypes) => {
  switch (action.type) {
    case TAG_ADD_FETCH:
      return state.concat(action.payload)
    case TAG_DELETE_FETCH:
      return state.filter((item) => item.key !== action.payload?.tagKey)
    case TAG_UPDATE_FETCH_SUC:
      state = action.payload.menu
      return [...state]
    default:
      return state
  }
}
