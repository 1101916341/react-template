const fs = require('fs')
const path = require('path')
const { createProxyMiddleware } = require('http-proxy-middleware')

const RACING_PATH = path.join(process.cwd(), '__json_server_mock__', 'racing.json')
const DB_PATH = path.join(process.cwd(), '__json_server_mock__', 'db.json')

module.exports = function (app) {
  // 读取 db.json：去除 UTF-8 BOM，文件不存在/为空时返回空对象；解析失败返回 ok=false（避免误覆盖已有数据）
  const readDb = () => {
    try {
      const content = fs.readFileSync(DB_PATH, 'utf-8').replace(/^\uFEFF/, '')
      if (!content.trim()) return { ok: true, db: {} }
      return { ok: true, db: JSON.parse(content) }
    } catch (e) {
      return { ok: false, error: e }
    }
  }

  // 保存 racing 数据到本地文件（去重合并）
  app.post('/api/save-racing', (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      let newData
      try {
        newData = JSON.parse(body)
      } catch (e) {
        return res.json({ success: false, message: 'JSON 解析失败' })
      }

      if (!Array.isArray(newData) || newData.length === 0) {
        return res.json({ success: true, added: 0, total: 0, message: '无数据' })
      }

      let existingData = []
      try {
        const content = fs.readFileSync(RACING_PATH, 'utf-8')
        existingData = JSON.parse(content).data || []
      } catch (e) {
        existingData = []
      }

      // 用 Id 去重，已存在的跳过
      const existingIds = new Set(existingData.map(item => item.Id))
      const uniqueNew = newData.filter(item => !existingIds.has(item.Id))

      if (uniqueNew.length === 0) {
        return res.json({ success: true, added: 0, total: existingData.length, message: '无新增数据' })
      }

      // 合并并按 Id 升序排列
      const merged = [...existingData, ...uniqueNew]
      merged.sort((a, b) => a.Id - b.Id)

      try {
        fs.writeFileSync(RACING_PATH, JSON.stringify({ data: merged }, null, 2), 'utf-8')
        console.log(`已保存 ${uniqueNew.length} 条新数据到 racing.json，共 ${merged.length} 条`)
        res.json({ success: true, added: uniqueNew.length, total: merged.length })
      } catch (e) {
        console.error('写入 racing.json 失败:', e)
        res.json({ success: false, message: '写入文件失败' })
      }
    })
  })

  // 读取 db.json 中 lgz 字段的数据：
  //   始终返回「一维数组」，即使文件里历史存在二维/脏数据，也会在此展平、去重、按 Id 升序后再返回
  app.get('/api/lgz', (req, res) => {
    const cleanItem = item => ({
      Id: Number(item && item.Id),
      DrawAt1: String(item && item.DrawAt1 != null ? item.DrawAt1 : ''),
      DrawAt2: String(item && item.DrawAt2 != null ? item.DrawAt2 : ''),
      H6: String(item && item.H6 != null ? item.H6 : '')
    })
    const isValidId = item => Number.isFinite(item.Id) && item.Id > 0

    const dbResult = readDb()
    if (!dbResult.ok) return res.json([])
    const db = dbResult.db

    // 展平一层：无论 lgz 是 [{...}] 还是 [[{...}],[{...}]]，统一拉平为单层数组
    const raw = Array.isArray(db.lgz) ? db.lgz : []
    const flat = []
    for (const item of raw) {
      if (Array.isArray(item)) flat.push(...item)
      else flat.push(item)
    }

    const list = flat.map(cleanItem).filter(isValidId)
    list.sort((a, b) => a.Id - b.Id)
    res.json(list)
  })

  // 保存 lgz 数据到 db.json：
  //   1. 存入前先按 Id 去重（与已有数据去重 + 本次批次内部去重）
  //   2. 只写入「一维数组」到 lgz 字段，绝不会生成二维数组
  //   3. 合并后按 Id 升序排列再落盘
  app.post('/api/lgz', (req, res) => {
    let body = ''
    req.on('data', chunk => { body += chunk })
    req.on('end', () => {
      let newData
      try {
        newData = JSON.parse(body)
      } catch (e) {
        return res.json({ success: false, message: 'JSON 解析失败' })
      }

      if (!Array.isArray(newData) || newData.length === 0) {
        return res.json({ success: true, added: 0, skipped: 0, total: 0, message: '无数据' })
      }

      // 清洗：仅保留业务字段，过滤掉 Id 非法（缺失 / 非数字 / <=0）的条目
      const cleanItem = item => ({
        Id: Number(item && item.Id),
        DrawAt1: String(item && item.DrawAt1 != null ? item.DrawAt1 : ''),
        DrawAt2: String(item && item.DrawAt2 != null ? item.DrawAt2 : ''),
        H6: String(item && item.H6 != null ? item.H6 : '')
      })
      const isValidId = item => Number.isFinite(item.Id) && item.Id > 0

      // 入参展平：即使请求体传的是二维数组，也只按一层对象处理，保证不会写入二维数组
      const incoming = []
      for (const item of newData) {
        if (Array.isArray(item)) incoming.push(...item)
        else incoming.push(item)
      }
      const cleanIncoming = incoming.map(cleanItem).filter(isValidId)

      if (cleanIncoming.length === 0) {
        return res.json({ success: true, added: 0, skipped: newData.length, total: 0, message: '无有效数据' })
      }

      const dbResult = readDb()
      if (!dbResult.ok) {
        return res.json({ success: false, message: '读取 db.json 失败，未写入（避免覆盖已有数据）' })
      }
      const db = dbResult.db

      // 读取已有数据并展平（防止历史脏数据/二维数组），再清洗
      const existingRaw = Array.isArray(db.lgz) ? db.lgz : []
      const existingFlat = []
      for (const item of existingRaw) {
        if (Array.isArray(item)) existingFlat.push(...item)
        else existingFlat.push(item)
      }
      const existing = existingFlat.map(cleanItem).filter(isValidId)

      // 去重：与已有数据比对 + 本次批次内部比对，Id 已存在的一律跳过
      const existingIds = new Set(existing.map(item => item.Id))
      const merged = [...existing]
      const seen = new Set(existingIds)
      const added = []
      const skippedIds = []
      for (const item of cleanIncoming) {
        if (seen.has(item.Id)) {
          skippedIds.push(item.Id)
        } else {
          seen.add(item.Id)
          added.push(item)
        }
      }

      if (added.length === 0) {
        return res.json({
          success: true,
          added: 0,
          skipped: skippedIds.length,
          total: existing.length,
          message: '无新增数据'
        })
      }

      // 合并后统一按 Id 升序，写入一维数组
      merged.push(...added)
      merged.sort((a, b) => a.Id - b.Id)

      db.lgz = merged
      try {
        fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8')
        console.log(`已保存 ${added.length} 条新数据到 db.json 的 lgz 字段，共 ${merged.length} 条（按 Id 升序，一维数组）`)
        res.json({
          success: true,
          added: added.length,
          skipped: skippedIds.length,
          total: merged.length
        })
      } catch (e) {
        console.error('写入 db.json 失败:', e)
        res.json({ success: false, message: '写入文件失败' })
      }
    })
  })

  app.use(
    '/admin',
    createProxyMiddleware({
      target: 'https://mockapi.eolink.com/uMEsS5g1c7128d2f413c56c19133cd1439cb6b062e9e26b',
      changeOrigin: true
    })
  )

  app.use(
    '/Ha1',
    createProxyMiddleware({
      target: 'https://lgz618618.com',
      changeOrigin: true,
      secure: false
    })
  )
}
