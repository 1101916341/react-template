const CracoLessPlugin = require('craco-less')

const HtmlWebpackPlugin = require('html-webpack-plugin')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

const path = require('path')
const webpack = require('webpack')
const WebpackBar = require('webpackbar')

const pathResolve = (pathUrl) => path.join(__dirname, pathUrl)

module.exports = {
  webpack: {
    alias: {
      '@': pathResolve('src'),
      '@api': pathResolve('src/api'),
      '@config': pathResolve('src/config'),
      '@routes': pathResolve('src/routes'),
      '@assets': pathResolve('src/assets'),
      '@store': pathResolve('src/store'),
      '@utils': pathResolve('src/utils'),
      '@views': pathResolve('src/views'),
      '@components': pathResolve('src/components'),
      '@style': pathResolve('src/style')
      // 此处是一个示例，实际可根据各自需求配置
    },
    plugins: [
      new WebpackBar({ profile: true }),
      ...(process.env.NODE_ENV === 'production'
        ? [
            new webpack.HashedModuleIdsPlugin(), // 根据hash生成生成ID
            new HtmlWebpackPlugin({
              inject: true, // 是否将js放在body的末尾
              chunks: ['vendor', 'entry']
            }),
            new UglifyJsPlugin({
              sourceMap: false,
              parallel: true
            })
          ]
        : [])
    ]
  },
  babel: {
    plugins: [
      ['import', { libraryName: 'antd', style: true }],
      ['@babel/plugin-proposal-decorators', { legacy: true }]
    ]
  },
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        // 此处根据 less-loader 版本的不同会有不同的配置，详见 less-loader 官方文档
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: { '@primary-color': '#0096d8' },
            javascriptEnabled: true
          }
        }
      }
    }
  ]
}
