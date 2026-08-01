// ============================================================
// 校验反馈引擎：用户给出实际开奖结果后，
// 与预测 / 历史数据比对，输出一致性结论与问题定位，并记录存档
// ============================================================

import { PredictionResult, VerifyIssue, VerifyResult, VerifyRecord, GroupFeatures } from './types'
import {
  sortGroup,
  validateGroup,
  extract_all_features,
  count_repeat_with_last,
  count_slanted_consecutive
} from './skills'
import { GlobalStats } from './analyzer'

// 解析一段文本为号码数组："1,2,3,4,5" / "1 2 3 4 5" / "[1,2,3,4,5]" 均可
export function parseGroupText(text: string): { nums: number[] | null; error: string | null } {
  const trimmed = text.trim()
  if (!trimmed) {
    return { nums: null, error: '输入不能为空' }
  }
  const jsonMatch = trimmed.match(/^\[(.*)\]$/)
  const content = jsonMatch ? jsonMatch[1] : trimmed
  const tokens = content
    .split(/[,，\s]+/)
    .filter(t => t.length > 0)
    .map(t => Number(t))
  if (tokens.length === 0) {
    return { nums: null, error: '未解析到任何数字' }
  }
  const error = validateGroup(tokens)
  if (error) {
    return { nums: null, error }
  }
  return { nums: sortGroup(tokens), error: null }
}

function formatNumList(nums: number[]): string {
  return nums.join(',')
}

// ============================================================
// 主入口：verifyDraw(prediction, actual, groups, globalStats, comboCountMap)
// 返回逐维度比对结果 + 总体结论
// ============================================================
export function verifyDraw(
  prediction: PredictionResult,
  actual: number[],
  groups: number[][],
  globalStats: GlobalStats,
  comboCountMap: Record<string, number>
): VerifyResult {
  const issues: VerifyIssue[] = []
  const actualSorted = sortGroup(actual)
  const actualFeatures: GroupFeatures = extract_all_features(actualSorted)
  const lastGroup = groups.length > 0 ? groups[groups.length - 1] : []

  // 1. 预测命中度
  const overlapWithPrimary = count_repeat_with_last(prediction.primary, actualSorted)
  const overlapWithAlternates = prediction.alternates.map(alt => count_repeat_with_last(alt, actualSorted))
  const maxOverlapAlternate = overlapWithAlternates.length > 0 ? Math.max(...overlapWithAlternates) : 0
  const matched = overlapWithPrimary === 5
  issues.push({
    dimension: '预测命中',
    level: matched ? 'info' : overlapWithPrimary >= 3 ? 'info' : 'warn',
    message: `实际结果与主推组合重合 ${overlapWithPrimary}/5，与备选组合最大重合 ${maxOverlapAlternate}/5。`
  })

  // 2. 组合重复频次
  const comboKey = actualSorted.join(',')
  const comboFreq = comboCountMap[comboKey] || 0
  issues.push({
    dimension: '组合重复频次',
    level: comboFreq > 1 ? 'info' : 'warn',
    message: `组合「${comboKey}」在历史 ${globalStats.total} 期中共出现 ${comboFreq} 次（${comboFreq === 1 ? '首现组合，属于相对小概率结构' : '重复组合，该结构存在惯性'}）。`
  })

  // 3. 奇偶配比
  const mainOddEven = globalStats.oddEvenDist[0]
  if (actualFeatures.oddEven.label === mainOddEven.label) {
    issues.push({
      dimension: '奇偶配比',
      level: 'info',
      message: `实际为「${actualFeatures.oddEven.label}」，与历史主流配比一致（占比 ${mainOddEven.frequency}%）。`
    })
  } else {
    issues.push({
      dimension: '奇偶配比',
      level: 'warn',
      message: `实际为「${actualFeatures.oddEven.label}」，非历史主流「${mainOddEven.label}」（占比 ${mainOddEven.frequency}%），属于相对少见配比。`
    })
  }

  // 4. 大小配比
  const mainBigSmall = globalStats.bigSmallDist[0]
  if (actualFeatures.bigSmall.label === mainBigSmall.label) {
    issues.push({
      dimension: '大小配比',
      level: 'info',
      message: `实际为「${actualFeatures.bigSmall.label}」，与历史主流大小配比一致（占比 ${mainBigSmall.frequency}%）。`
    })
  } else {
    issues.push({
      dimension: '大小配比',
      level: 'warn',
      message: `实际为「${actualFeatures.bigSmall.label}」，非历史主流「${mainBigSmall.label}」（占比 ${mainBigSmall.frequency}%）。`
    })
  }

  // 5. 和值
  const [sumMin, sumMax] = prediction.expected.sumRange
  const inRange = actualFeatures.math.sum >= sumMin && actualFeatures.math.sum <= sumMax
  issues.push({
    dimension: '和值',
    level: inRange ? 'info' : 'warn',
    message: `实际和值 ${actualFeatures.math.sum}，${inRange ? '落在' : '偏离'}预测主区间 ${sumMin}~${sumMax}（历史平均 ${globalStats.sumStats.mean}）。`
  })

  // 6. 重号
  const repeatWithLast = count_repeat_with_last(lastGroup, actualSorted)
  const expectedRepeat = prediction.expected.repeatFromLast
  issues.push({
    dimension: '重号',
    level: repeatWithLast === expectedRepeat ? 'info' : 'warn',
    message: `与上期（${formatNumList(lastGroup)}）重号 ${repeatWithLast} 个，预测期望 ${expectedRepeat} 个。`
  })

  // 7. 斜连号
  const slantedCount = count_slanted_consecutive(lastGroup, actualSorted)
  issues.push({
    dimension: '斜连号',
    level: 'info',
    message: `相对上期开出斜连号（±1 跟随）${slantedCount} 个。`
  })

  // 8. 冷热号
  const hotNums = globalStats.hotCold.hotTop.map(f => f.number)
  const coldNums = globalStats.hotCold.coldBottom.map(f => f.number)
  const missedNums = globalStats.hotCold.missedTop.map(f => f.number)
  const hotHit = actualSorted.filter(n => hotNums.includes(n)).length
  const coldHit = actualSorted.filter(n => coldNums.includes(n)).length
  const missedHit = actualSorted.filter(n => missedNums.includes(n)).length
  issues.push({
    dimension: '冷热号',
    level: 'info',
    message: `包含热号(${hotNums.join(',')})${hotHit} 个、冷号(${coldNums.join(',')})${coldHit} 个、高遗漏号(${missedNums.join(',')})${missedHit} 个。`
  })

  // 9. 连号结构
  const mainConsecutive = globalStats.consecutiveDist[0]
  if (actualFeatures.consecutive.desc === mainConsecutive.label) {
    issues.push({
      dimension: '连号结构',
      level: 'info',
      message: `实际为「${actualFeatures.consecutive.desc}」，与历史主流连号结构一致（占比 ${mainConsecutive.frequency}%）。`
    })
  } else {
    issues.push({
      dimension: '连号结构',
      level: 'warn',
      message: `实际为「${actualFeatures.consecutive.desc}」，非历史主流「${mainConsecutive.label}」（占比 ${mainConsecutive.frequency}%）。`
    })
  }

  // 总体结论
  let conclusion: string
  if (matched) {
    conclusion = '✅ 本期实际结果完全命中主推组合，预测引擎的特征约束全部生效，规律性得到验证。'
  } else if (overlapWithPrimary >= 3) {
    conclusion = `⚠️ 本期实际结果与主推组合重合 ${overlapWithPrimary}/5（备选最高 ${maxOverlapAlternate}/5），主要特征约束大体吻合，属于可接受的预测偏差。`
  } else {
    conclusion = `❌ 本期实际结果未命中主推组合（重合 ${overlapWithPrimary}/5）。原因排查建议：1) 若实际结果各特征普遍偏离历史主流，则该期属于随机波动 / 低概率形态；2) 若连续多期完全偏离，需检查数据源是否缺行、号码顺序是否错位，或游戏规则（11 选 5）是否发生变化；3) 统计规律反映的是长期倾向，单期不可作为确定性依据。`
  }

  return {
    valid: true,
    matched,
    overlapWithPrimary,
    maxOverlapAlternate,
    actualFeatures,
    issues,
    conclusion
  }
}

// 生成一条校验记录（用于历史留存与复盘）
export function createVerifyRecord(
  prediction: PredictionResult,
  actual: number[],
  verifyResult: VerifyResult
): VerifyRecord {
  const warnCount = verifyResult.issues.filter(i => i.level === 'warn' || i.level === 'error').length
  return {
    id: Date.now(),
    timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
    predicted: formatNumList(prediction.primary),
    actual: formatNumList(actual),
    overlap: verifyResult.overlapWithPrimary,
    matched: verifyResult.matched,
    issueSummary: `${verifyResult.issues.length} 项维度校验，${warnCount} 项偏离主流；${verifyResult.conclusion}`
  }
}

