// ============================================================
// 数据解析 - 接口拉取层（parse1 页使用）
//
// 复用旧版「数据获取功能」逻辑：
//   - 循环调用 apiUrl，POST body 传 { id }，headers 携带 _t_ / Cookie
//   - 响应期望格式：{ d: [ { Id, DrawAt1, DrawAt2, H1, H2, H3, H4, H5 } ] }
//     兼容 { data } / { list }，字段兼容大写 H1~H5 与小写 h1~h5
//   - 本层只负责「拉取 + 归一化」，不校验 11选5 硬约束（由页面处理）
// ============================================================

export interface ApiFetchParams {
  apiUrl: string
  headerT?: string
  headerCookie?: string
  initId: number
  idMode: 'increment' | 'decrement'
  loopCount: number
}

// 单条接口原始数据（归一化后）
export interface ApiRow {
  key: string
  id: number
  drawAt1: string
  drawAt2: string
  h1: number
  h2: number
  h3: number
  h4: number
  h5: number
  hGroup: number[]
  hGroupText: string
  sum: number
  quotient: number
  remainder: number
  average: number
  range: number
}

export interface FetchRacingResult {
  rows: ApiRow[]
  errors: string[]
}

const num = (v: any): number | null => {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

// 归一化单条响应 item（H1~H5 等），数字非法时返回 null 丢弃
function normalizeItem(item: any, key: string): ApiRow | null {
  const h1 = num(item?.H1 ?? item?.h1)
  const h2 = num(item?.H2 ?? item?.h2)
  const h3 = num(item?.H3 ?? item?.h3)
  const h4 = num(item?.H4 ?? item?.h4)
  const h5 = num(item?.H5 ?? item?.h5)
  if (h1 === null || h2 === null || h3 === null || h4 === null || h5 === null) {
    return null
  }
  const hGroup = [h1, h2, h3, h4, h5]
  const sum = hGroup.reduce((acc, n) => acc + n, 0)
  return {
    key,
    id: Number(item?.Id ?? item?.id ?? 0),
    drawAt1: String(item?.DrawAt1 ?? item?.drawAt1 ?? ''),
    drawAt2: String(item?.DrawAt2 ?? item?.drawAt2 ?? ''),
    h1,
    h2,
    h3,
    h4,
    h5,
    hGroup,
    hGroupText: hGroup.join(','),
    sum,
    quotient: Math.floor(sum / 5),
    remainder: sum % 5,
    average: +(sum / 5).toFixed(2),
    range: Math.max(...hGroup) - Math.min(...hGroup)
  }
}

// 单次调用：POST { id } 到 apiUrl
async function fetchOnce(
  apiUrl: string,
  headers: Record<string, string>,
  id: number
): Promise<{ rows: ApiRow[]; error?: string }> {
  let resp: Response
  try {
    resp = await fetch(apiUrl, {
      method: 'POST',
      mode: 'cors',
      credentials: 'include',
      headers,
      body: JSON.stringify({ id })
    })
  } catch (e: any) {
    return { rows: [], error: `Id=${id} 网络请求失败：${e?.message || String(e)}` }
  }

  let text: string
  try {
    text = await resp.text()
  } catch (e: any) {
    return { rows: [], error: `Id=${id} 读取响应失败：${e?.message || String(e)}` }
  }

  let json: any
  try {
    json = JSON.parse(text)
  } catch (e) {
    return { rows: [], error: `Id=${id} 响应非 JSON（HTTP ${resp.status}）` }
  }

  const dataArr = Array.isArray(json?.d)
    ? json.d
    : Array.isArray(json?.data)
    ? json.data
    : Array.isArray(json?.list)
    ? json.list
    : []

  const rows: ApiRow[] = []
  dataArr.forEach((item: any, idx: number) => {
    const row = normalizeItem(item, `${id}-${idx + 1}`)
    if (row) rows.push(row)
  })
  return { rows }
}

// 主入口：按 loopCount 循环拉取并归一化（ID 递增 +10 / 递减 -10）
export async function fetchRacingData(params: ApiFetchParams): Promise<FetchRacingResult> {
  const { apiUrl, headerT, headerCookie, initId, idMode, loopCount } = params
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (headerT) headers['_t_'] = headerT
  if (headerCookie) headers['Cookie'] = headerCookie

  const rows: ApiRow[] = []
  const errors: string[] = []
  const count = Math.max(1, Math.floor(loopCount || 1))

  for (let i = 0; i < count; i++) {
    const rawId = idMode === 'increment' ? initId + i * 10 : initId - i * 10
    const id = rawId < 0 ? 0 : rawId
    const { rows: part, error } = await fetchOnce(apiUrl, headers, id)
    rows.push(...part)
    if (error) errors.push(error)
  }

  return { rows, errors }
}
