// ============================================================
// 数据输入解析 + 示例数据集
// 支持粘贴：每行一组 5 个数字（逗号 / 空格 / JSON 数组均可）
// 示例数据存于 samples.json（带"人为偏差"的 2000 期样本），
// 由 loadSampleData() 读取，页面加载示例数据时不再随机生成。
// samples.json 由 npm run sample:gen 重新生成（基于 generateSampleData，固定种子可复现）。
// ============================================================

import { FULL_SET, GROUP_SIZE } from './types'
import { sortGroup, validateGroup, calc_consecutive_count } from './skills'
import { mulberry32 } from './predictor'
import sampleDataJson from './samples.json'

export const SAMPLE_SIZE = 2000

// 解析粘贴文本为多组号码（每行一组）
export function parseInputText(text: string): { groups: number[][]; errors: string[] } {
  const lines = text.split(/\r?\n/)
  const groups: number[][] = []
  const errors: string[] = []
  lines.forEach((line, idx) => {
    const trimmed = line.trim()
    if (!trimmed) return
    const jsonMatch = trimmed.match(/^\[(.*)\]$/)
    const content = jsonMatch ? jsonMatch[1] : trimmed
    const tokens = content
      .split(/[,，\s]+/)
      .filter(t => t.length > 0)
      .map(t => Number(t))
    const error = validateGroup(tokens)
    if (error) {
      errors.push(`第 ${idx + 1} 行：${error}（${trimmed}）`)
    } else {
      groups.push(sortGroup(tokens))
    }
  })
  return { groups, errors }
}

// 将多组号码序列化为文本（便于回填输入框 / 导出）
export function groupsToText(groups: number[][]): string {
  return groups.map(g => g.join(',')).join('\n')
}

// 从 JSON 文件加载示例数据（构建期随 bundle 打包，无需网络请求）
// 逐行校验 11 选 5 硬约束并排序，非法行收集到 errors（页面据此提示）
export function loadSampleData(): { groups: number[][]; errors: string[] } {
  const groups: number[][] = []
  const errors: string[] = []
  if (!Array.isArray(sampleDataJson)) {
    return { groups, errors: ['示例数据 JSON 顶层应为数组'] }
  }
  sampleDataJson.forEach((row: number[], idx) => {
    if (!Array.isArray(row)) {
      errors.push(`第 ${idx + 1} 行不是数组`)
      return
    }
    const error = validateGroup(row)
    if (error) {
      errors.push(`第 ${idx + 1} 行：${error}（[${row.join(',')}]）`)
    } else {
      groups.push(sortGroup(row))
    }
  })
  return { groups, errors }
}

// ============================================================
// 示例数据生成：在满足 11 选 5 硬约束的前提下，
// 人为注入冷热差异、主流奇偶 / 大小 / 连号偏好，模拟真实走势
// ============================================================

// 基础权重：制造冷热差异（11 号最冷、6 号最热）
const BASE_WEIGHT: Record<number, number> = {
  1: 4,
  2: 5,
  3: 4,
  4: 6,
  5: 5,
  6: 8,
  7: 4,
  8: 6,
  9: 3,
  10: 5,
  11: 2
}

const ODDEVEN_PATTERNS: { odd: number; even: number; w: number }[] = [
  { odd: 3, even: 2, w: 42 },
  { odd: 2, even: 3, w: 32 },
  { odd: 4, even: 1, w: 10 },
  { odd: 1, even: 4, w: 8 },
  { odd: 5, even: 0, w: 5 },
  { odd: 0, even: 5, w: 3 }
]

const BIGSMALL_PATTERNS: { small: number; big: number; w: number }[] = [
  { small: 2, big: 3, w: 36 },
  { small: 3, big: 2, w: 36 },
  { small: 1, big: 4, w: 12 },
  { small: 4, big: 1, w: 12 },
  { small: 5, big: 0, w: 2 },
  { small: 0, big: 5, w: 2 }
]

// 按权重随机选一个模式
function pickPattern<T extends { w: number }>(rnd: () => number, patterns: T[]): T {
  const total = patterns.reduce((acc, p) => acc + p.w, 0)
  let r = rnd() * total
  for (const p of patterns) {
    r -= p.w
    if (r <= 0) return p
  }
  return patterns[patterns.length - 1]
}

// 从池中按权重抽取 n 个不重复号码
function sampleN(rnd: () => number, weights: Record<number, number>, pool: number[], n: number): number[] {
  const result: number[] = []
  const remaining = [...pool]
  for (let i = 0; i < n; i++) {
    const total = remaining.reduce((acc, num) => acc + (weights[num] || 1), 0)
    let r = rnd() * total
    let picked = remaining[remaining.length - 1]
    for (const num of remaining) {
      r -= weights[num] || 1
      if (r <= 0) {
        picked = num
        break
      }
    }
    result.push(picked)
    const idx = remaining.indexOf(picked)
    if (idx >= 0) remaining.splice(idx, 1)
  }
  return result
}

// 按指定奇数个数 / 小号个数构造组合（无法满足时返回 null）
function buildByCounts(
  rnd: () => number,
  weights: Record<number, number>,
  oddCount: number,
  smallCount: number
): number[] | null {
  const smallOdd = [1, 3, 5]
  const bigOdd = [7, 9, 11]
  const smallEven = [2, 4]
  const bigEven = [6, 8, 10]
  const evenCount = GROUP_SIZE - oddCount
  const bigCount = GROUP_SIZE - smallCount

  const soMin = Math.max(0, oddCount - bigOdd.length, smallCount - smallEven.length)
  const soMax = Math.min(oddCount, smallOdd.length, smallCount)
  for (let so = soMin; so <= soMax; so++) {
    const bo = oddCount - so
    const se = smallCount - so
    const be = evenCount - se
    if (bo < 0 || bo > bigOdd.length) continue
    if (se < 0 || se > smallEven.length) continue
    if (be < 0 || be > bigEven.length) continue
    if (bo + be !== bigCount) continue
    const result: number[] = []
    result.push(...sampleN(rnd, weights, smallOdd, so))
    result.push(...sampleN(rnd, weights, bigOdd, bo))
    result.push(...sampleN(rnd, weights, smallEven, se))
    result.push(...sampleN(rnd, weights, bigEven, be))
    return sortGroup(result)
  }
  return null
}

// 生成一注带偏好的样本
function drawSample(rnd: () => number, consecRoll: () => number): number[] {
  for (let attempt = 0; attempt < 80; attempt++) {
    const oe = pickPattern(rnd, ODDEVEN_PATTERNS)
    const bs = pickPattern(rnd, BIGSMALL_PATTERNS)
    const combo = buildByCounts(rnd, BASE_WEIGHT, oe.odd, bs.small)
    if (!combo) continue
    const roll = consecRoll()
    const consecutive = calc_consecutive_count(combo)
    if (roll < 0.5) {
      // 无连号
      if (consecutive.hasConsecutive) continue
    } else if (roll < 0.82) {
      // 至少一组二连
      if (consecutive.maxConsecutiveLength < 2) continue
    } else {
      // 三连及以上
      if (consecutive.maxConsecutiveLength < 3) continue
    }
    return combo
  }
  // 兜底：完全随机合法组合
  const pool = [...FULL_SET]
  const res: number[] = []
  while (res.length < GROUP_SIZE) {
    const idx = Math.floor(rnd() * pool.length)
    res.push(pool[idx])
    pool.splice(idx, 1)
  }
  return sortGroup(res)
}

// 生成 count 期示例数据（固定种子，可复现）
export function generateSampleData(count: number): number[][] {
  const rnd = mulberry32(20260731)
  const consecRoll = mulberry32(777)
  const groups: number[][] = []
  for (let i = 0; i < count; i++) {
    groups.push(drawSample(rnd, consecRoll))
  }
  return groups
}

