const fs = require('fs')
const path = require('path')
const { createProxyMiddleware } = require('http-proxy-middleware')

const RACING_PATH = path.join(process.cwd(), '__json_server_mock__', 'racing.json')

module.exports = function (app) {
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