// ============================================================
// 重新生成「示例数据」JSON 文件
//
// 页面「加载示例数据」不再每次随机生成，而是读取
// src/views/dataParsing/parse1/samples.json。
// 该 JSON 由本脚本通过 generateSampleData()（固定种子、可复现）
// 落盘生成；数据有变更时执行 npm run sample:gen 即可重新生成。
//
// 用法：npm run sample:gen
//       （等价于 npx ts-node --project tsconfig.scripts.json scripts/generateSampleData.ts）
// ============================================================

import * as fs from 'fs'
import * as path from 'path'

import { generateSampleData, SAMPLE_SIZE } from '../src/views/dataParsing/parse1/sampleData'

const targetPath = path.resolve(__dirname, '../src/views/dataParsing/parse1/samples.json')

// 重新生成（固定种子 → 结果可复现）
const groups = generateSampleData(SAMPLE_SIZE)

// 紧凑且易读的序列化：顶层数组 + 每行一注 [1,2,3,4,5]
const content = `[\n${groups.map(g => `  [${g.join(',')}]`).join(',\n')}\n]\n`

fs.writeFileSync(targetPath, content, 'utf-8')

console.log(`[sample:gen] 已重新生成示例数据 JSON：${targetPath}`)
console.log(`[sample:gen] 期数：${groups.length}，大小：${fs.statSync(targetPath).size} bytes`)
