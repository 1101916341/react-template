import dayjs from 'dayjs'

// 单个 去除首尾空格
export function myTrim(x: string): string {
  return x ? x.replace(/^\s+|\s+$/gm, '') : ''
}

// 下载功能
export const handleFile = (url: string, name: string) => {
  const href = window.location.href
  if (href.includes('localhost')) {
    url = 'http://192.168.21.23:8082' + url
  } else {
    url = href.split('/#').slice(0, 1).join('') + url
  }
  const link = document.createElement('a')
  link.style.display = 'none' //使其隐藏
  link.href = url //赋予文件下载地址
  link.target = '_blank'
  link.setAttribute('download', name) //设置下载属性 以及文件名
  document.body.appendChild(link) //a标签插至页面中
  link.click()
}

/**
 * 深拷贝
 * @param {Object} obj  要拷贝的对象
 *
 */
export const deepClose = (obj: any = {}) => {
  if (typeof obj !== 'object' || obj == null) {
    return obj
  }
  let result: any
  if (obj instanceof Array) {
    result = []
  } else {
    result = {}
  }
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = deepClose(obj[key])
    }
  }
  return result
}
