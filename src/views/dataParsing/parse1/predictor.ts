// ============================================================
// 下期预测引擎：基于全局统计 + 跨期规律的规则打分模型
// 输出：主推组合 + 备选组合 + 结构化推理依据（为什么会这样）
// 说明：彩票本质随机，此处给出的是"统计形态倾向性"，非确定性结论
// ============================================================

import {
  FULL_SET,
  GROUP_SIZE,
  SUM_MIN,
  SUM_MAX,
  PredictionResult,
  PredictionReason,
  GroupFeatures
} from './types'
import {
  sortGroup,
  extract_all_features,
  count_repeat_with_last,
  count_slanted_consecutive
} from './skills'
import { GlobalStats, CrossPeriodStats, DistributionItem } from './analyzer'

// 可复现的伪随机数（mulberry32）
export function mulberry32(seed: number): () => number {
  let a = seed
  return function () {
    a += 0x6d2b79f5
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 从 "3奇2偶" / "2小3大" / "1低2中2高" / "重1个" 中解析数字
function parseCount(label: string, key: string): number {
  const match = label.match(new RegExp(`(\\d+)${key}`))
  return match ? Number(match[1]) : 0
}

// 随机生成一组合法组合
function randomCombination(rnd: () => number): number[] {
  const pool = [...FULL_SET]
  const res: number[] = []
  for (let i = 0; i < GROUP_SIZE; i++) {
    const idx = Math.floor(rnd() * pool.length)
    res.push(pool[idx])
    pool.splice(idx, 1)
  }
  return sortGroup(res)
}

const WEIGHT_ODDEVEN = 30
const WEIGHT_BIGSMALL = 30
const WEIGHT_SUM = 20
const WEIGHT_ZONE = 15
const WEIGHT_REPEAT = 12
const WEIGHT_HOT = 8
const WEIGHT_SLANTED = 6
const WEIGHT_COLD = 5

export interface PredictTargets {
  oddEven: DistributionItem
  bigSmall: DistributionItem
  zone: DistributionItem
  repeatItem: DistributionItem
  slantedItem: DistributionItem
  sumRange: [number, number]
  hotNumbers: number[]
  coldNumbers: number[]
  missedNumbers: number[]
}

// 依据统计结果确定下期形态约束目标
export function resolveTargets(
  globalStats: GlobalStats,
  crossStats: CrossPeriodStats,
  lastGroup: number[]
): PredictTargets {
  const oddEven = globalStats.oddEvenDist[0]
  const bigSmall = globalStats.bigSmallDist[0]
  const zone = globalStats.zoneDist[0]
  const repeatItem = crossStats.repeatDist[0]
  const slantedItem = crossStats.slantedDist[0]
  const mean = globalStats.sumStats.mean
  const sumRange: [number, number] = [
    Math.max(SUM_MIN, Math.round(mean - 8)),
    Math.min(SUM_MAX, Math.round(mean + 8))
  ]

  const hotNumbers = globalStats.hotCold.hotTop.map(f => f.number)
  const coldNumbers = globalStats.hotCold.coldBottom.map(f => f.number)
  const missedNumbers = globalStats.hotCold.missedTop.map(f => f.number)

  return { oddEven, bigSmall, zone, repeatItem, slantedItem, sumRange, hotNumbers, coldNumbers, missedNumbers }
}

// 候选组合打分：命中主流形态越多得分越高
function scoreCombo(combo: number[], targets: PredictTargets, lastGroup: number[]): number {
  const features = extract_all_features(combo)
  let score = 0
  if (features.oddEven.label === targets.oddEven.label) score += WEIGHT_ODDEVEN
  if (features.bigSmall.label === targets.bigSmall.label) score += WEIGHT_BIGSMALL
  if (features.math.sum >= targets.sumRange[0] && features.math.sum <= targets.sumRange[1]) score += WEIGHT_SUM
  if (features.zone.label === targets.zone.label) score += WEIGHT_ZONE
  const repeat = count_repeat_with_last(lastGroup, combo)
  const repeatTarget = parseCount(targets.repeatItem.label, '个')
  if (repeat === repeatTarget) score += WEIGHT_REPEAT
  else if (Math.abs(repeat - repeatTarget) <= 1) score += WEIGHT_REPEAT / 2
  score += combo.filter(n => targets.hotNumbers.includes(n)).length * WEIGHT_HOT
  const slantedTarget = parseCount(targets.slantedItem.label, '个')
  if (count_slanted_consecutive(lastGroup, combo) >= slantedTarget) score += WEIGHT_SLANTED
  score += combo.filter(n => targets.coldNumbers.includes(n)).length * WEIGHT_COLD
  return score
}

// 生成主推组合的逐维度推理依据
function buildReasons(
  targets: PredictTargets,
  primary: number[],
  primaryFeatures: GroupFeatures,
  globalStats: GlobalStats,
  crossStats: CrossPeriodStats,
  lastGroup: number[]
): PredictionReason[] {
  const repeatTarget = parseCount(targets.repeatItem.label, '个')
  const slantedTarget = parseCount(targets.slantedItem.label, '个')
  const repeat = count_repeat_with_last(lastGroup, primary)
  const slantedNums = primary.filter(n => lastGroup.includes(n - 1) || lastGroup.includes(n + 1))
  const hotHit = primary.filter(n => targets.hotNumbers.includes(n))
  const coldHit = primary.filter(n => targets.coldNumbers.includes(n))
  const missedHit = primary.filter(n => targets.missedNumbers.includes(n))

  return [
    {
      dimension: '奇偶配比',
      description: `历史 ${globalStats.total} 期中，最主流配比为「${targets.oddEven.label}」，占比 ${targets.oddEven.frequency}%（${targets.oddEven.count} 次），主推组合同样采用「${primaryFeatures.oddEven.label}」。`
    },
    {
      dimension: '大小配比',
      description: `最主流大小配比为「${targets.bigSmall.label}」，占比 ${targets.bigSmall.frequency}%（${targets.bigSmall.count} 次），主推组合配置为「${primaryFeatures.bigSmall.label}」。`
    },
    {
      dimension: '和值区间',
      description: `历史平均和值 ${globalStats.sumStats.mean}（中位数 ${globalStats.sumStats.median}），主推区间 ${targets.sumRange[0]}~${targets.sumRange[1]}（均值±8），主推组合和值 ${primaryFeatures.math.sum} 落在区间内。`
    },
    {
      dimension: '三区分布',
      description: `最主流三区结构为「${targets.zone.label}」，占比 ${targets.zone.frequency}%（${targets.zone.count} 次），主推组合三区分布为「${primaryFeatures.zone.label}」（${primaryFeatures.balancedZone ? '三区均有覆盖' : '三区未全覆盖'}）。`
    },
    {
      dimension: '重号惯性',
      description: `相邻两期重号最常出现 ${repeatTarget} 个（占比 ${targets.repeatItem.frequency}%），上期为 ${lastGroup.join(',')}，主推组合与上期重合 ${repeat} 个。`
    },
    {
      dimension: '斜连号',
      description: `相邻两期斜连（上期±1跟随）最常出现 ${slantedTarget} 个，主推组合含斜连号 ${slantedNums.length > 0 ? slantedNums.join(',') : '0 个'}。`
    },
    {
      dimension: '冷热号',
      description: `全局热号 ${targets.hotNumbers.join(',')}、冷号 ${targets.coldNumbers.join(',')}、高遗漏号 ${targets.missedNumbers.join(',')}；主推组合含热号 ${hotHit.length > 0 ? hotHit.join(',') : '0 个'}、冷号回补 ${coldHit.length > 0 ? coldHit.join(',') : '0 个'}、遗漏回补 ${missedHit.length > 0 ? missedHit.join(',') : '0 个'}。`
    },
    {
      dimension: '连号结构',
      description: `历史最多连号结构为「${globalStats.consecutiveDist[0].label}」（占比 ${globalStats.consecutiveDist[0].frequency}%），主推组合连号形态为「${primaryFeatures.consecutive.desc}」（间隔差分 ${primaryFeatures.gaps.gaps.join(',')}${primaryFeatures.gaps.uniformGap ? '，呈等差结构' : ''}）。`
    },
    {
      dimension: '近N期轮动',
      description: `近 ${crossStats.recentWindow} 期热号为 ${crossStats.recentHotCold.hotTop.map(f => f.number).join(',')}、冷号为 ${crossStats.recentHotCold.coldBottom.map(f => f.number).join(',')}，主推组合侧重 ${targets.hotNumbers.join(',')} 等全局偏热号码，兼顾 ${targets.missedNumbers.join(',')} 等遗漏回补。`
    }
  ]
}

// ============================================================
// 主入口：predictNext(groups, globalStats, crossStats)
// 候选生成 + 打分排序，返回主推 / 备选 / 推理依据
// ============================================================
export function predictNext(groups: number[][], globalStats: GlobalStats, crossStats: CrossPeriodStats): PredictionResult {
  const lastGroup = groups.length > 0 ? groups[groups.length - 1] : []
  const targets = resolveTargets(globalStats, crossStats, lastGroup)
  const rnd = mulberry32((groups.length * 2654435761) % 2147483647)

  const candidates: { combo: number[]; score: number }[] = []
  for (let i = 0; i < 4000; i++) {
    const combo = randomCombination(rnd)
    candidates.push({ combo, score: scoreCombo(combo, targets, lastGroup) })
  }
  candidates.sort((a, b) => b.score - a.score)

  const seen = new Set<string>()
  const topCombos: number[][] = []
  for (const item of candidates) {
    const key = item.combo.join(',')
    if (!seen.has(key)) {
      seen.add(key)
      topCombos.push(item.combo)
    }
    if (topCombos.length >= 6) break
  }

  const primary = topCombos[0]
  const alternates = topCombos.slice(1)
  const primaryFeatures = extract_all_features(primary)
  const reasons = buildReasons(targets, primary, primaryFeatures, globalStats, crossStats, lastGroup)

  return {
    primary,
    alternates,
    primaryFeatures,
    expected: {
      oddEven: targets.oddEven.label,
      bigSmall: targets.bigSmall.label,
      zone: targets.zone.label,
      sumRange: targets.sumRange,
      repeatFromLast: parseCount(targets.repeatItem.label, '个')
    },
    reasons
  }
}


