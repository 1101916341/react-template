// ============================================================
// 第一大类 Skill：单组 5 个数字内部数学特征提取
// 每个函数对应一个可注册给 LangChain Agent 的工具
// 函数命名与需求清单一致：calc_ / split_ / get_ / count_ 等
// ============================================================

import {
  FULL_SET,
  ODD_NUMBERS,
  EVEN_NUMBERS,
  SMALL_NUMBERS,
  BIG_NUMBERS,
  PRIME_NUMBERS,
  COMPOSITE_NUMBERS,
  COMBINATION_COUNT,
  GROUP_SIZE,
  MathStats,
  OddEvenCount,
  BigSmallCount,
  ZoneDistribute,
  ConsecutiveInfo,
  GapDiffInfo,
  TailFeatures,
  PrimeCompositeCount,
  PatternTag,
  GroupFeatures,
  NumberFrequency,
  HotColdResult
} from './types'

// 升序排序（输入校验后使用）
export function sortGroup(group: number[]): number[] {
  return [...group].sort((a, b) => a - b)
}

// 校验一组号码是否符合硬约束：恰好 5 个、1~11、不重复
// 返回错误信息，通过返回 null
export function validateGroup(nums: number[]): string | null {
  if (nums.length !== GROUP_SIZE) {
    return `必须恰好 ${GROUP_SIZE} 个数字（当前 ${nums.length} 个）`
  }
  const seen = new Set<number>()
  for (const n of nums) {
    if (!Number.isInteger(n) || n < 1 || n > 11) {
      return `数字必须为 1~11 的整数（存在非法值 ${n}）`
    }
    if (seen.has(n)) {
      return `存在重复数字 ${n}`
    }
    seen.add(n)
  }
  return null
}

// Skill: calc_sum_and_range(group) → 和值、极差（Max-Min）
export function calc_sum_and_range(group: number[]): { sum: number; max: number; min: number; range: number } {
  const sorted = sortGroup(group)
  const max = sorted[sorted.length - 1]
  const min = sorted[0]
  return {
    sum: sorted.reduce((acc, n) => acc + n, 0),
    max,
    min,
    range: max - min
  }
}

// Skill: 基础统计特征 → 均值 / 中位数 / 方差 / 标准差
export function calc_math_stats(group: number[]): MathStats {
  const sorted = sortGroup(group)
  const sum = sorted.reduce((acc, n) => acc + n, 0)
  const len = sorted.length
  const mean = sum / len
  const mid = Math.floor(len / 2)
  const median = len % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
  const variance = sorted.reduce((acc, n) => acc + Math.pow(n - mean, 2), 0) / len
  return {
    sum,
    mean: +mean.toFixed(2),
    median: +median.toFixed(2),
    max: sorted[len - 1],
    min: sorted[0],
    range: sorted[len - 1] - sorted[0],
    variance: +variance.toFixed(2),
    stdDev: +Math.sqrt(variance).toFixed(2)
  }
}

// Skill: split_odd_even_count(group) → 奇偶数个数配比
export function split_odd_even_count(group: number[]): OddEvenCount {
  const odd = group.filter(n => n % 2 === 1).length
  const even = group.length - odd
  return { odd, even, label: `${odd}奇${even}偶` }
}

// Skill: split_big_small_count(group) → 大小号数量配比（分界值 6）
export function split_big_small_count(group: number[]): BigSmallCount {
  const small = group.filter(n => SMALL_NUMBERS.includes(n)).length
  const big = group.length - small
  return { small, big, label: `${small}小${big}大` }
}

// Skill: calc_zone_distribute(group) → 低(1~4)中(5~8)高(9~11)三区分布
export function calc_zone_distribute(group: number[]): ZoneDistribute {
  const low = group.filter(n => n >= 1 && n <= 4).length
  const mid = group.filter(n => n >= 5 && n <= 8).length
  const high = group.filter(n => n >= 9 && n <= 11).length
  return { low, mid, high, label: `${low}低${mid}中${high}高` }
}

// Skill: calc_consecutive_count(group) → 连号组数、最长连号长度、连号描述
export function calc_consecutive_count(group: number[]): ConsecutiveInfo {
  const sorted = sortGroup(group)
  const groupLengths: number[] = []
  let runLength = 1
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] - sorted[i - 1] === 1) {
      runLength++
    } else {
      if (runLength >= 2) {
        groupLengths.push(runLength)
      }
      runLength = 1
    }
  }
  if (runLength >= 2) {
    groupLengths.push(runLength)
  }
  const maxConsecutiveLength = groupLengths.length > 0 ? Math.max(...groupLengths) : 1
  const consecutivePairs = groupLengths.reduce((acc, len) => acc + (len - 1), 0)

  let desc = '无连号'
  if (groupLengths.length === 1 && maxConsecutiveLength === 2) {
    desc = '1组二连号'
  } else if (groupLengths.length === 2 && maxConsecutiveLength === 2) {
    desc = '两组独立二连号'
  } else if (maxConsecutiveLength >= 3) {
    desc = `${maxConsecutiveLength}连号`
  } else if (groupLengths.length > 0) {
    desc = `${groupLengths.length}组二连号`
  }

  return {
    hasConsecutive: groupLengths.length > 0,
    consecutiveGroups: groupLengths.length,
    maxConsecutiveLength,
    groupLengths,
    consecutivePairs,
    desc
  }
}

// Skill: calc_gap_diff(group) → 排序后相邻间隔差分、等差结构、跳号统计
export function calc_gap_diff(group: number[]): GapDiffInfo {
  const sorted = sortGroup(group)
  const gaps: number[] = []
  for (let i = 1; i < sorted.length; i++) {
    gaps.push(sorted[i] - sorted[i - 1])
  }
  const allEqual = gaps.length > 0 && gaps.every(g => g === gaps[0])
  return {
    gaps,
    uniformGap: allEqual,
    gapValue: allEqual ? gaps[0] : null,
    gapTwoCount: gaps.filter(g => g === 2).length,
    gapsAboveOne: gaps.filter(g => g >= 2).length,
    minGap: gaps.length > 0 ? Math.min(...gaps) : 0,
    maxGap: gaps.length > 0 ? Math.max(...gaps) : 0
  }
}

// Skill: 尾数特征 → 尾数不重复数量、重复尾数、尾数奇偶、尾数大小
export function calc_tail_features(group: number[]): TailFeatures {
  const tails = group.map(n => n % 10)
  const distinct = Array.from(new Set(tails))
  const countMap: Record<number, number> = {}
  tails.forEach(t => {
    countMap[t] = (countMap[t] || 0) + 1
  })
  const duplicateTails = distinct.filter(t => countMap[t] > 1)
  return {
    tails,
    distinctTailCount: distinct.length,
    duplicateTails,
    oddTailCount: tails.filter(t => t % 2 === 1).length,
    evenTailCount: tails.filter(t => t % 2 === 0).length,
    bigTailCount: tails.filter(t => t >= 5).length,
    smallTailCount: tails.filter(t => t < 5).length
  }
}

// Skill: prime_composite_count(group) → 质数 / 合数 / 特殊数字 1 数量
export function prime_composite_count(group: number[]): PrimeCompositeCount {
  const primes = group.filter(n => PRIME_NUMBERS.includes(n))
  const composites = group.filter(n => COMPOSITE_NUMBERS.includes(n))
  const hasOne = group.includes(1)
  return {
    primes,
    composites,
    hasOne,
    primeCount: primes.length,
    compositeCount: composites.length,
    desc: `${primes.length}质${composites.length}合${hasOne ? '+1特殊' : ''}`
  }
}

// Skill: tag_group_pattern(group) → 结构标签（全散 / 短连 / 长连 / 小号扎堆 / 大号扎堆 / 均衡分散）
// 优先级：小号扎堆 > 大号扎堆 > 长连型 > 短连型 > 全散型
export function tag_group_pattern(group: number[]): PatternTag {
  const sorted = sortGroup(group)
  const allSmall = sorted.every(n => SMALL_NUMBERS.includes(n))
  const allBig = sorted.every(n => BIG_NUMBERS.includes(n))
  const consecutive = calc_consecutive_count(sorted)
  const zone = calc_zone_distribute(sorted)
  const balancedZone = zone.low > 0 && zone.mid > 0 && zone.high > 0

  let tag = '全散型'
  if (allSmall) {
    tag = '小号扎堆型'
  } else if (allBig) {
    tag = '大号扎堆型'
  } else if (consecutive.maxConsecutiveLength >= 3) {
    tag = '长连型'
  } else if (consecutive.hasConsecutive) {
    tag = '短连型'
  }

  return { tag, balancedZone, allSmall, allBig }
}

// Skill: count_repeat_with_last(prev_group, curr_group) → 跨期重号数量
export function count_repeat_with_last(prevGroup: number[], currGroup: number[]): number {
  return currGroup.filter(n => prevGroup.includes(n)).length
}

// Skill: 斜连号 / 斜跳号 → 本期数字等于上期 ±1 的个数
export function count_slanted_consecutive(prevGroup: number[], currGroup: number[]): number {
  return currGroup.filter(n => prevGroup.includes(n - 1) || prevGroup.includes(n + 1)).length
}

// Skill: get_hot_cold_number(all_data_list) → 全局冷热号统计 + 当前遗漏期数
export function get_hot_cold_number(groups: number[][]): HotColdResult {
  const total = groups.length
  const countMap: Record<number, number> = {}
  FULL_SET.forEach(n => {
    countMap[n] = 0
  })
  groups.forEach(g => {
    g.forEach(n => {
      countMap[n] = (countMap[n] || 0) + 1
    })
  })

  const frequencies: NumberFrequency[] = FULL_SET.map(n => {
    const latestDrawIndex = groups.reduce((found, g, idx) => (g.includes(n) ? idx : found), -1)
    return {
      number: n,
      count: countMap[n],
      frequency: total > 0 ? +((countMap[n] / total) * 100).toFixed(2) : 0,
      latestDrawIndex,
      missCount: latestDrawIndex < 0 ? total : total - 1 - latestDrawIndex
    }
  })

  const byCountDesc = [...frequencies].sort((a, b) => b.count - a.count)
  const hotTop = byCountDesc.slice(0, 3)
  const coldBottom = byCountDesc.slice(-3)
  const missedTop = [...frequencies].sort((a, b) => b.missCount - a.missCount).slice(0, 3)

  return { total, frequencies, hotTop, coldBottom, missedTop }
}

// Skill: extract_all_features(group) → 一次提取全部单组特征（Agent 主循环调用）
export function extract_all_features(group: number[]): GroupFeatures {
  const sorted = sortGroup(group)
  const pattern = tag_group_pattern(sorted)
  return {
    raw: [...group],
    sorted,
    math: calc_math_stats(sorted),
    oddEven: split_odd_even_count(sorted),
    bigSmall: split_big_small_count(sorted),
    zone: calc_zone_distribute(sorted),
    consecutive: calc_consecutive_count(sorted),
    gaps: calc_gap_diff(sorted),
    tails: calc_tail_features(sorted),
    primeComposite: prime_composite_count(sorted),
    patternTag: pattern.tag,
    balancedZone: pattern.balancedZone
  }
}

// 理论概率参考（462 种组合下的理论占比，用于评估样本偏差）
export function theoreticalProbabilities(): { key: string; expected: number; count: number }[] {
  const totalCombos = COMBINATION_COUNT
  const comb = (n: number, k: number): number => {
    if (k < 0 || k > n) return 0
    let result = 1
    for (let i = 0; i < k; i++) {
      result = (result * (n - i)) / (i + 1)
    }
    return Math.round(result)
  }
  const oddOptions = ODD_NUMBERS.length
  const evenOptions = EVEN_NUMBERS.length
  const smallOptions = SMALL_NUMBERS.length
  const bigOptions = BIG_NUMBERS.length

  const results: { key: string; expected: number; count: number }[] = []
  for (let odd = 0; odd <= 5; odd++) {
    const even = 5 - odd
    const count = comb(oddOptions, odd) * comb(evenOptions, even)
    results.push({
      key: `${odd}奇${even}偶`,
      expected: +(count / totalCombos).toFixed(4),
      count
    })
  }
  for (let small = 0; small <= 5; small++) {
    const big = 5 - small
    const count = comb(smallOptions, small) * comb(bigOptions, big)
    results.push({
      key: `${small}小${big}大`,
      expected: +(count / totalCombos).toFixed(4),
      count
    })
  }
  return results
}


