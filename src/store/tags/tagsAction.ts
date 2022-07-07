import { TAG_ADD_FETCH, tagState, tagUpdateState, tagDelState, TAG_UPDATE_FETCH_SUC, TAG_DELETE_FETCH } from './types'

export const tagAddFnc = (value: tagState) => ({ type: TAG_ADD_FETCH, payload: value })
export const tagDelFnc = (value: tagDelState) => ({ type: TAG_DELETE_FETCH, payload: { tagKey: value } })
export const tagUpdateFnc = (value: tagUpdateState) => ({ type: TAG_UPDATE_FETCH_SUC, payload: value })
