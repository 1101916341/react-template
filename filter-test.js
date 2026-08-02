const http = require('http')

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let body = ''
      res.on('data', (c) => (body += c))
      res.on('end', () => {
        try {
          resolve(JSON.parse(body))
        } catch (e) {
          reject(e)
        }
      })
    }).on('error', reject)
  })
}

// replicate dbJsonTable logic exactly
const SEARCH_FIELDS = [
  { key: 'Id', label: 'Id', width: 160, mode: 'gte' },
  { key: 'DrawAt1', label: 'DrawAt1', width: 180, mode: 'gte' },
  { key: 'DrawAt2', label: 'DrawAt2', width: 160, mode: 'gte' },
  { key: 'H6', label: 'H6', width: 240, mode: 'match' }
]

function matchRow(row, key, keyword) {
  if (!keyword) return true
  const field = SEARCH_FIELDS.find((f) => f.key === key)
  const value = String(row[key] ?? '')
  if (field && field.mode === 'gte') {
    if (key === 'Id') {
      const rowNum = Number(row.Id)
      const filterNum = Number(keyword)
      return Number.isFinite(rowNum) && Number.isFinite(filterNum) && rowNum >= filterNum
    }
    return value >= keyword
  }
  return value.toLowerCase().includes(keyword.toLowerCase())
}

function filtered(rows, filters) {
  return rows.filter((row) => SEARCH_FIELDS.every(({ key }) => matchRow(row, key, (filters[key] || '').trim())))
}

;(async () => {
  const rows = await fetchJson('http://127.0.0.1:3000/api/lgz')
  console.log('TOTAL_ROWS=', rows.length)

  const tests = [
    { Id: '514244' },
    { Id: '514244', DrawAt1: '2026-08-02' },
    { Id: '514244', DrawAt1: '2026-08-02', DrawAt2: '13:00:00' }
  ]
  for (const t of tests) {
    const res = filtered(rows, t)
    console.log('FILTER=', JSON.stringify(t), 'COUNT=', res.length)
    if (res.length) {
      console.log('  FIRST=', JSON.stringify(res[0]))
      console.log('  LAST=', JSON.stringify(res[res.length - 1]))
    }
  }

  // also confirm no filter returns everything
  console.log('NO_FILTER_COUNT=', filtered(rows, {}).length)
})()
