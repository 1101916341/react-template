import {
  validateGroup,
  calc_sum_and_range,
  calc_math_stats,
  split_odd_even_count,
  split_big_small_count,
  calc_zone_distribute,
  calc_consecutive_count,
  calc_gap_diff,
  prime_composite_count,
  tag_group_pattern,
  count_repeat_with_last,
  count_slanted_consecutive,
  get_hot_cold_number,
  extract_all_features,
  theoreticalProbabilities
} from './skills'
import { analyzeGlobalStats, analyzeCrossPeriod } from './analyzer'
import { predictNext } from './predictor'
import { verifyDraw, createVerifyRecord, parseGroupText } from './verify'
import { generateSampleData, loadSampleData, parseInputText, SAMPLE_SIZE } from './sampleData'

describe('parse1 skills', () => {
  test('validateGroup 硬约束', () => {
    expect(validateGroup([1, 2, 3, 4, 5])).toBeNull()
    expect(validateGroup([1, 2, 3, 4])).not.toBeNull()
    expect(validateGroup([1, 2, 3, 4, 12])).not.toBeNull()
    expect(validateGroup([1, 2, 3, 4, 4])).not.toBeNull()
  })

  test('calc_sum_and_range / calc_math_stats', () => {
    const r = calc_sum_and_range([1, 2, 3, 4, 5])
    expect(r.sum).toBe(15)
    expect(r.range).toBe(4)
    const m = calc_math_stats([1, 2, 3, 4, 5])
    expect(m.mean).toBe(3)
    expect(m.median).toBe(3)
    expect(m.variance).toBe(2)
  })

  test('奇偶 / 大小 / 三区 / 质合', () => {
    expect(split_odd_even_count([1, 2, 3, 4, 5]).label).toBe('3奇2偶')
    expect(split_big_small_count([1, 2, 3, 4, 5]).label).toBe('5小0大')
    expect(calc_zone_distribute([1, 5, 6, 9, 11]).label).toBe('1低2中2高')
    expect(prime_composite_count([2, 3, 4, 6, 1]).desc).toBe('2质2合+1特殊')
  })

  test('连号结构', () => {
    expect(calc_consecutive_count([1, 3, 5, 7, 9]).desc).toBe('无连号')
    expect(calc_consecutive_count([1, 2, 5, 6, 9]).desc).toBe('两组独立二连号')
    expect(calc_consecutive_count([1, 2, 3, 5, 6]).desc).toBe('3连号')
    expect(calc_consecutive_count([5, 6, 7, 8, 9]).maxConsecutiveLength).toBe(5)
  })

  test('间隔差分 / 等差', () => {
    const g = calc_gap_diff([1, 3, 5, 7, 9])
    expect(g.uniformGap).toBe(true)
    expect(g.gapValue).toBe(2)
    expect(g.gapTwoCount).toBe(4)
  })

  test('结构标签', () => {
    expect(tag_group_pattern([1, 2, 3, 4, 5]).tag).toBe('小号扎堆型')
    expect(tag_group_pattern([7, 8, 9, 10, 11]).tag).toBe('大号扎堆型')
    expect(tag_group_pattern([1, 2, 3, 6, 10]).tag).toBe('长连型')
    expect(tag_group_pattern([1, 2, 5, 8, 11]).tag).toBe('短连型')
    expect(tag_group_pattern([1, 4, 6, 8, 10]).tag).toBe('全散型')
    expect(tag_group_pattern([1, 5, 6, 9, 11]).balancedZone).toBe(true)
  })

  test('重号 / 斜连号', () => {
    expect(count_repeat_with_last([1, 2, 3, 4, 5], [1, 3, 6, 7, 8])).toBe(2)
    expect(count_slanted_consecutive([1, 2, 3, 4, 5], [2, 3, 7, 8, 9])).toBe(2)
  })

  test('理论概率', () => {
    const theory = theoreticalProbabilities()
    const oe = theory.find(t => t.key === '3奇2偶')
    expect(oe).toBeDefined()
    if (oe) expect(oe.count).toBe(200)
  })
})

describe('parse1 analysis engine', () => {
  const groups = generateSampleData(2000)

  test('示例数据满足硬约束', () => {
    expect(groups.length).toBe(2000)
    groups.forEach(g => expect(validateGroup(g)).toBeNull())
  })

  test('全局统计', () => {
    const features = groups.map(g => extract_all_features(g))
    const stats = analyzeGlobalStats(groups, features)
    expect(stats.total).toBe(2000)
    expect(stats.uniqueCombinationCount).toBeLessThanOrEqual(462)
    expect(stats.sumStats.min).toBeGreaterThanOrEqual(15)
    expect(stats.sumStats.max).toBeLessThanOrEqual(45)
    expect(stats.hotCold.hotTop.length).toBe(3)
    expect(stats.oddEvenDist[0].frequency).toBeGreaterThan(0)
  })

  test('跨期统计', () => {
    const cross = analyzeCrossPeriod(groups)
    expect(cross.pairCount).toBe(1999)
    expect(cross.repeatDist.length).toBeGreaterThan(0)
    expect(cross.slantedDist.length).toBeGreaterThan(0)
  })

  test('预测输出合法且可解释', () => {
    const features = groups.map(g => extract_all_features(g))
    const stats = analyzeGlobalStats(groups, features)
    const cross = analyzeCrossPeriod(groups)
    const pred = predictNext(groups, stats, cross)
    expect(validateGroup(pred.primary)).toBeNull()
    expect(pred.alternates.length).toBe(5)
    expect(pred.reasons.length).toBeGreaterThanOrEqual(8)
  })

  test('校验主推组合应完全命中', () => {
    const features = groups.map(g => extract_all_features(g))
    const stats = analyzeGlobalStats(groups, features)
    const cross = analyzeCrossPeriod(groups)
    const pred = predictNext(groups, stats, cross)
    const result = verifyDraw(pred, pred.primary, groups, stats, stats.comboCountMap)
    expect(result.matched).toBe(true)
    expect(result.overlapWithPrimary).toBe(5)
    const record = createVerifyRecord(pred, pred.primary, result)
    expect(record.overlap).toBe(5)
  })
})

describe('parse1 sample JSON', () => {
  test('示例数据 JSON 满足硬约束且期数正确', () => {
    const { groups, errors } = loadSampleData()
    expect(errors).toHaveLength(0)
    expect(groups.length).toBe(SAMPLE_SIZE)
    groups.forEach(g => expect(validateGroup(g)).toBeNull())
  })

  test('示例数据 JSON 与生成器输出保持一致（未过期，可执行 npm run sample:gen 重新生成）', () => {
    const { groups } = loadSampleData()
    expect(groups).toEqual(generateSampleData(SAMPLE_SIZE))
  })
})

describe('parse1 input parsing', () => {
  test('parseInputText 支持多行与 JSON 行', () => {
    const { groups, errors } = parseInputText('1,2,3,4,5\n[6, 7, 8, 9, 10]\n1 2 3 4 12\n1,1,2,3,4')
    expect(groups.length).toBe(2)
    expect(errors.length).toBe(2)
  })

  test('parseGroupText', () => {
    expect(parseGroupText('2,4,6,8,10').nums).toEqual([2, 4, 6, 8, 10])
    expect(parseGroupText('1,2,3,4').error).not.toBeNull()
  })
})
