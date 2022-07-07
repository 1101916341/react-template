export const TAG_ADD_FETCH = 'TAG_ADD_FETCH'
export const TAG_DELETE_FETCH = 'TAG_DELETE_FETCH'
export const TAG_UPDATE_FETCH_SUC = 'TAG_UPDATE_FETCH_SUC'

// State
export interface tagState {
  title: string
  key: string
  content: any
  closable: boolean
  path: string
}

export interface tagUpdateState {
  menu: [title: string, key: string, content: any, closable: boolean, path: string]
}

export interface tagDelState {
  tagKey: string
}

// Action
export interface TagAddAction {
  type: typeof TAG_ADD_FETCH
  payload: tagState
}

export interface TagUpdateAction {
  type: typeof TAG_UPDATE_FETCH_SUC
  payload: tagUpdateState
}

export interface TagDelAction {
  type: typeof TAG_DELETE_FETCH
  payload: tagDelState
}

export type TagsTypes = TagAddAction | TagDelAction | TagUpdateAction
