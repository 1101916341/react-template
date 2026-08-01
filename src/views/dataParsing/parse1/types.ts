// ============================================================
// 底层硬约束（不可变规则全集，所有规律基于此前提）
// 全集：S = {1,2,3,4,5,6,7,8,9,10,11}，共 11 个不重复自然数
// 每组样本：抽取 5 个不重复数字
// 总组合：C(11,5) = 462 种纯组合；有序排列 P(11,5) = 55440 种
// ============================================================

export const FULL_SET = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
export const GROUP_SIZE = 5

export const COMBINATION_COUNT = 462
export const PERMUTATION_COUNT = 55440

// 奇偶分区：奇数 6 个、偶数 5 个
export const ODD_NUMBERS = [1, 3, 5, 7, 9, 11]
export const EVEN_NUMBERS = [2, 4, 6, 8, 10]

// 大小分区（分界值 6）：小号 5 个（1~5）、大号 6 个（6~11）
export const SMALL_NUMBERS = [1, 2, 3, 4, 5]
export const BIG_NUMBERS = [6, 7, 8, 9, 10, 11]

// 三区分段：低区 1~4、中区 5~8、高区 9~11
export const ZONE_LOW_NUMBERS = [1, 2, 3, 4]
export const ZONE_MID_NUMBERS = [5, 6, 7, 8]
export const ZONE_HIGH_NUMBERS = [9, 10, 11]

// 质数 / 合数 / 特殊数
export const PRIME_NUMBERS = [2, 3, 5, 7, 11]
export const COMPOSITE_NUMBERS = [4, 6, 8, 9, 10]

// 近 N 期冷热轮动窗口默认值
export const DEFAULT_RECENT_WINDOW = 30

// 和值理论范围：最小 15（1+2+3+4+5）、最大 45（7+8+9+10+11）
export const SUM_MIN = 15
export const SUM_MAX = 45

export interface MathStats {
  sum: number
  mean: number
  median: number
  max: number
  min: number
  range: number
  variance: number
  stdDev: number
}

export interface OddEvenCount {
  odd: number
  even: number
  label: string
}

export interface BigSmallCount {
  small: number
  big: number
  label: string
}

export interface ZoneDistribute {
  low: number
  mid: number
  high: number
  label: string
}

export interface ConsecutiveInfo {
  hasConsecutive: boolean
  consecutiveGroups: number
  maxConsecutiveLength: number
  groupLengths: number[]
  consecutivePairs: number
  desc: string
}

export interface GapDiffInfo {
  gaps: number[]
  uniformGap: boolean
  gapValue: number | null
  gapTwoCount: number
  gapsAboveOne: number
  minGap: number
  maxGap: number
}

export interface TailFeatures {
  tails: number[]
  distinctTailCount: number
  duplicateTails: number[]
  oddTailCount: number
  evenTailCount: number
  bigTailCount: number
  smallTailCount: number
}

export interface PrimeCompositeCount {
  primes: number[]
  composites: number[]
  hasOne: boolean
  primeCount: number
  compositeCount: number
  desc: string
}

export interface PatternTag {
  tag: string
  balancedZone: boolean
  allSmall: boolean
  allBig: boolean
}

export interface GroupFeatures {
  raw: number[]
  sorted: number[]
  math: MathStats
  oddEven: OddEvenCount
  bigSmall: BigSmallCount
  zone: ZoneDistribute
  consecutive: ConsecutiveInfo
  gaps: GapDiffInfo
  tails: TailFeatures
  primeComposite: PrimeCompositeCount
  patternTag: string
  balancedZone: boolean
}

export interface NumberFrequency {
  number: number
  count: number
  frequency: number
  missCount: number
  latestDrawIndex: number
}

export interface HotColdResult {
  total: number
  frequencies: NumberFrequency[]
  hotTop: NumberFrequency[]
  coldBottom: NumberFrequency[]
  missedTop: NumberFrequency[]
}

export interface PredictionReason {
  dimension: string
  description: string
}

export interface PredictionResult {
  primary: number[]
  alternates: number[][]
  primaryFeatures: GroupFeatures
  expected: {
    oddEven: string
    bigSmall: string
    zone: string
    sumRange: [number, number]
    repeatFromLast: number
  }
  reasons: PredictionReason[]
}

export interface VerifyIssue {
  dimension: string
  level: 'info' | 'warn' | 'error'
  message: string
}

export interface VerifyResult {
  valid: boolean
  matched: boolean
  overlapWithPrimary: number
  maxOverlapAlternate: number
  actualFeatures: GroupFeatures
  issues: VerifyIssue[]
  conclusion: string
}

export interface VerifyRecord {
  id: number
  timestamp: string
  predicted: string
  actual: string
  overlap: number
  matched: boolean
  issueSummary: string
}
