const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = function (app) {
  app.use(
    '/admin',
    createProxyMiddleware({
      target: ' https://mockapi.eolink.com/uMEsS5g1c7128d2f413c56c19133cd1439cb6b062e9e26b',
      changeOrigin: true
    })
  )
}
