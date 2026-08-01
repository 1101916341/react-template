// ============================================================
// 第二 / 三大类分析：全局统计 + 跨期时序规律 + 结构分类占比
// Agent 主循环批量提取特征后，由本模块汇总为结构化报表
// ============================================================

import {
  DEFAULT_RECENT_WINDOW,
  SUM_MIN,
  SUM_MAX,
  GroupFeatures,
  HotColdResult
} from './types'
import {
  sortGroup,
  count_repeat_with_last,
  count_slanted_consecutive,
  split_odd_even_count,
  split_big_small_count,
  get_hot_cold_number
} from './skills'

export interface DistributionItem {
  label: string
  count: number
  frequency: number
}

export interface SumBin {
  bin: string
  min: number
  max: number
  count: number
  frequency: number
}

export interface GlobalStats {
  total: number
  uniqueCombinationCount: number
  duplicateCount: number
  topRepeated: { key: string; count: number }[]
  comboCountMap: Record<string, number>
  sumBins: SumBin[]
  sumStats: {
    min: number
    max: number
    mean: number
    median: number
    modeBins: string[]
  }
  oddEvenDist: DistributionItem[]
  bigSmallDist: DistributionItem[]
  zoneDist: DistributionItem[]
  consecutiveDist: DistributionItem[]
  primeCompositeDist: DistributionItem[]
  tailDistinctDist: DistributionItem[]
  patternTagDist: DistributionItem[]
  balancedZoneRate: number
  hotCold: HotColdResult
}

export interface RatioRun {
  label: string
  maxRun: number
  avgRun: number
}

export interface CrossPeriodStats {
  pairCount: number
  repeatDist: DistributionItem[]
  slantedDist: DistributionItem[]
  oddEvenRun: RatioRun[]
  bigSmallRun: RatioRun[]
  sumTrend: {
    upCount: number
    downCount: number
    maxUpStreak: number
    maxDownStreak: number
    currentDirection: 'up' | 'down' | 'flat'
    avgSum: number
  }
  recentWindow: number
  recentHotCold: HotColdResult
}

// 将字符串标签数组统计成分布表（含百分比）
function buildDistribution(items: string[]): DistributionItem[] {
  const countMap: Record<string, number> = {}
  items.forEach(label => {
    countMap[label] = (countMap[label] || 0) + 1
  })
  const total = items.length
  return Object.keys(countMap)
    .map(label => ({
      label,
      count: countMap[label],
      frequency: total > 0 ? +((countMap[label] / total) * 100).toFixed(2) : 0
    }))
    .sort((a, b) => b.count - a.count)
}

function medianOf(arr: number[]): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? +((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2) : sorted[mid]
}

// 统计标签连续出现（惯性）的最长连出与平均连出
function calcRunStats(labels: string[]): RatioRun[] {
  const runs: Record<string, number[]> = {}
  let curLabel = ''
  let cur = 0
  for (let i = 0; i < labels.length; i++) {
    if (labels[i] === curLabel) {
      cur++
    } else {
      if (curLabel && cur > 0) {
        if (!runs[curLabel]) {
          runs[curLabel] = []
        }
        runs[curLabel].push(cur)
      }
      curLabel = labels[i]
      cur = 1
    }
  }
  if (curLabel && cur > 0) {
    if (!runs[curLabel]) {
      runs[curLabel] = []
    }
    runs[curLabel].push(cur)
  }
  return Object.keys(runs)
    .map(label => {
      const list = runs[label]
      return {
        label,
        maxRun: Math.max(...list),
        avgRun: +(list.reduce((a, b) => a + b, 0) / list.length).toFixed(2)
      }
    })
    .sort((a, b) => b.maxRun - a.maxRun)
}

// ============================================================
// 全局单组特征统计（针对全部样本）
// ============================================================
export function analyzeGlobalStats(groups: number[][], features: GroupFeatures[]): GlobalStats {
  const total = groups.length

  // 纯组合重复频次统计（C(11,5)=462 上限，重复频次即最重要规律）
  const comboCountMap: Record<string, number> = {}
  groups.forEach(g => {
    const key = sortGroup(g).join(',')
    comboCountMap[key] = (comboCountMap[key] || 0) + 1
  })
  const uniqueCombinationCount = Object.keys(comboCountMap).length
  const duplicateCount = total - uniqueCombinationCount
  const topRepeated = Object.entries(comboCountMap)
    .map(([key, count]) => ({ key, count }))
    .filter(item => item.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // 和值区间分布（15~45，每 5 分一段）
  const sumBins: SumBin[] = []
  const sumBinCount: Record<number, number> = {}
  features.forEach(f => {
    const idx = Math.floor((f.math.sum - SUM_MIN) / 5)
    sumBinCount[idx] = (sumBinCount[idx] || 0) + 1
  })
  const binStart = 15
  const binEnd = 45
  for (let idx = 0; idx <= 6; idx++) {
    const start = binStart + idx * 5
    const end = Math.min(start + 4, binEnd)
    const count = sumBinCount[idx] || 0
    sumBins.push({
      bin: `${start}-${end}`,
      min: start,
      max: end,
      count,
      frequency: total > 0 ? +((count / total) * 100).toFixed(2) : 0
    })
  }
  const sums = features.map(f => f.math.sum)
  const maxBinCount = Math.max(...sumBins.map(b => b.count))
  const sumStats = {
    min: Math.min(...sums),
    max: Math.max(...sums),
    mean: total > 0 ? +(sums.reduce((a, b) => a + b, 0) / total).toFixed(2) : 0,
    median: medianOf(sums),
    modeBins: sumBins.filter(b => b.count === maxBinCount).map(b => b.bin)
  }

  const oddEvenDist = buildDistribution(features.map(f => f.oddEven.label))
  const bigSmallDist = buildDistribution(features.map(f => f.bigSmall.label))
  const zoneDist = buildDistribution(features.map(f => f.zone.label))
  const consecutiveDist = buildDistribution(features.map(f => f.consecutive.desc))
  const primeCompositeDist = buildDistribution(features.map(f => f.primeComposite.desc))
  const tailDistinctDist = buildDistribution(features.map(f => `${f.tails.distinctTailCount}种尾数`))
  const patternTagDist = buildDistribution(features.map(f => f.patternTag))
  const balancedZoneRate = total > 0 ? +((features.filter(f => f.balancedZone).length / total) * 100).toFixed(2) : 0

  return {
    total,
    uniqueCombinationCount,
    duplicateCount,
    topRepeated,
    comboCountMap,
    sumBins,
    sumStats,
    oddEvenDist,
    bigSmallDist,
    zoneDist,
    consecutiveDist,
    primeCompositeDist,
    tailDistinctDist,
    patternTagDist,
    balancedZoneRate,
    hotCold: get_hot_cold_number(groups)
  }
}

// ============================================================
// 跨期时序规律统计（2000 条按时间顺序相邻两期比较）
// ============================================================
export function analyzeCrossPeriod(groups: number[][], recentWindow: number = DEFAULT_RECENT_WINDOW): CrossPeriodStats {
  const total = groups.length
  const pairCount = Math.max(0, total - 1)

  const repeatCounts: number[] = []
  const slantedCounts: number[] = []
  for (let i = 1; i < total; i++) {
    repeatCounts.push(count_repeat_with_last(groups[i - 1], groups[i]))
    slantedCounts.push(count_slanted_consecutive(groups[i - 1], groups[i]))
  }
  const repeatDist = buildDistribution(repeatCounts.map(c => `重${c}个`))
  const slantedDist = buildDistribution(slantedCounts.map(c => `斜${c}个`))

  // 奇偶 / 大小配比连出惯性
  const oddEvenLabels = groups.map(g => split_odd_even_count(g).label)
  const bigSmallLabels = groups.map(g => split_big_small_count(g).label)
  const oddEvenRun = calcRunStats(oddEvenLabels)
  const bigSmallRun = calcRunStats(bigSmallLabels)

  // 和值波动：连续走高 / 走低、均值
  const sums = groups.map(g => g.reduce((acc, n) => acc + n, 0))
  let upCount = 0
  let downCount = 0
  let maxUpStreak = 0
  let maxDownStreak = 0
  let curUp = 0
  let curDown = 0
  for (let i = 1; i < sums.length; i++) {
    if (sums[i] > sums[i - 1]) {
      upCount++
      curUp++
      curDown = 0
      maxUpStreak = Math.max(maxUpStreak, curUp)
    } else if (sums[i] < sums[i - 1]) {
      downCount++
      curDown++
      curUp = 0
      maxDownStreak = Math.max(maxDownStreak, curDown)
    } else {
      curUp = 0
      curDown = 0
    }
  }
  let currentDirection: 'up' | 'down' | 'flat' = 'flat'
  if (sums.length >= 2) {
    currentDirection = sums[sums.length - 1] > sums[sums.length - 2] ? 'up' : sums[sums.length - 1] < sums[sums.length - 2] ? 'down' : 'flat'
  }
  const avgSum = total > 0 ? +(sums.reduce((a, b) => a + b, 0) / total).toFixed(2) : 0

  // 近 N 期冷热轮动
  const recentGroups = groups.slice(-recentWindow)
  const recentHotCold = get_hot_cold_number(recentGroups)

  return {
    pairCount,
    repeatDist,
    slantedDist,
    oddEvenRun,
    bigSmallRun,
    sumTrend: {
      upCount,
      downCount,
      maxUpStreak,
      maxDownStreak,
      currentDirection,
      avgSum
    },
    recentWindow,
    recentHotCold
  }
}

